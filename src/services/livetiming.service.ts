import WebSocket from 'ws';
import { env } from '../config/env.js';
import { emperorService } from './emperor.service.js';

export interface DriverLapRecord {
  lapNumber: number;
  lapTimeMs: number;
  lapFormatted: string;
  isPersonalBest: boolean;
  topSpeedKmh: number;
  tyre: string;
  timestamp: string;
}

export interface LiveChatMessage {
  id: string;
  time: string;
  timeFormatted: string;
  driverGuid: string;
  driverName: string;
  message: string;
}

export interface LiveServerLog {
  id: string;
  time: string;
  timeFormatted: string;
  type: string;
  name: string;
  driverName: string;
  carModel: string;
  lap: number | string;
  triggeredBy: string;
  context: string;
}

export interface LiveMapDriver {
  guid: string;
  carId: number;
  name: string;
  initials: string;
  raceNumber: number;
  carModel: string;
  carName: string;
  tyres: string;
  position: number;
  isInPits: boolean;
  ping: number;
  speedKmh: number;
  topSpeedKmh: number;
  gear: number;
  gearDisplay: string;
  rpm: number;
  maxRpm: number;
  rpmPct: number;
  steerAngle: number;
  steerDeg: number;
  throttlePct: number;
  brakePct: number;
  longitudinalG: number;
  drsActive: boolean;
  blueFlag: boolean;
  yellowFlag: boolean;
  hasCompletedSession: boolean;
  currentSector: number;
  splinePct: number;
  deltaToBestMs: number;
  deltaToSelfMs: number;
  deltaToBestFormatted: string;
  deltaToSelfFormatted: string;
  headingDeg: number;
  numLaps: number;
  bestLapMs: number;
  bestLapFormatted: string;
  lastLapFormatted: string;
  gap: string;
  ballast: number;
  restrictor: number;
  incidentsCount: number;
  hasPosition: boolean;
  worldX: number;
  worldZ: number;
  mapPixelX: number;
  mapPixelY: number;
  mapPercentX: number;
  mapPercentY: number;
  color: string;
  laps: DriverLapRecord[];
}

export interface StoredSessionTime {
  guid: string;
  name: string;
  carModel: string;
  carName: string;
  tyres: string;
  bestLapMs: number;
  bestLapFormatted: string;
  lastLapFormatted: string;
  numLaps: number;
  topSpeedKmh: number;
  isOnline: boolean;
}

export interface LiveCollisionEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  epochMs: number;
  driverGuid: string;
  driverName: string;
  carName: string;
  otherDriverName: string;
  type: 'car' | 'environment';
  typeLabel: string;
  speedKmh: number;
  sector: number;
  worldX: number;
  worldZ: number;
  mapPercentX: number;
  mapPercentY: number;
  damageZones: [number, number, number, number]; // [front, rear, left, right]
}

export interface LiveTelemetryState {
  connectedToWs: boolean;
  realtimePosIntervalMs: number;
  serverName: string;
  trackId: string;
  trackLayout: string;
  trackTitle: string;
  trackCity: string;
  trackCountry: string;
  trackLength: string;
  sessionType: string;
  sessionDurationMinutes: number;
  sessionWaitTimeSeconds: number;
  sessionLaps: number;
  sessionStartTime: string;
  elapsedSeconds: number;
  ambientTemp: number;
  roadTemp: number;
  joinUrl: string;
  password: string;
  mapImageUrl: string;
  previewImageUrl: string;
  trackFlag: 'green' | 'yellow' | 'blue' | 'checkered';
  trackFlagTitle: string;
  trackFlagSubtitle: string;
  yellowSectors: number[];
  mapData: {
    width: number;
    height: number;
    margin: number;
    scaleFactor: number;
    offsetX: number;
    offsetY: number;
    padding: number;
  };
  drivers: LiveMapDriver[];
  storedTimes: StoredSessionTime[];
  collisions: LiveCollisionEvent[];
  chat: LiveChatMessage[];
  serverLogs: LiveServerLog[];
  updatedAt: string;
}

const DRIVER_COLORS = [
  '#00f5d4',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#a855f7',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

type StateListener = (state: LiveTelemetryState) => void;

export class LiveTimingService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private detailsPollTimer: NodeJS.Timeout | null = null;

  private carIdToGuid = new Map<number, string>();
  private driversByGuid = new Map<string, LiveMapDriver>();
  private storedTimesList: StoredSessionTime[] = [];
  private collisionsList: LiveCollisionEvent[] = [];
  private chatList: LiveChatMessage[] = [];
  private serverLogList: LiveServerLog[] = [];
  private driverLapsMap = new Map<string, DriverLapRecord[]>();
  private listeners = new Set<StateListener>();

  // Per-driver physics tracking for sudden impact detection
  private prevPhysicsByGuid = new Map<
    string,
    { speedMps: number; timeMs: number; lastImpactMs: number }
  >();

  private state: LiveTelemetryState = {
    connectedToWs: false,
    realtimePosIntervalMs: 500,
    serverName: 'LATAM SimRacing Alliance',
    trackId: '',
    trackLayout: '',
    trackTitle: 'Cargando circuito...',
    trackCity: '',
    trackCountry: '',
    trackLength: '',
    sessionType: 'Práctica',
    sessionDurationMinutes: 0,
    sessionWaitTimeSeconds: 0,
    sessionLaps: 0,
    sessionStartTime: new Date().toISOString(),
    elapsedSeconds: 0,
    ambientTemp: 20,
    roadTemp: 26,
    joinUrl: emperorService.getContentManagerJoinButtonUrl(),
    password: env.AC_SERVER_PASSWORD || '',
    mapImageUrl: '',
    previewImageUrl: '',
    trackFlag: 'green',
    trackFlagTitle: 'BANDERA VERDE',
    trackFlagSubtitle: 'Pista libre en todos los sectores',
    yellowSectors: [],
    mapData: {
      width: 1600,
      height: 1600,
      margin: 20,
      scaleFactor: 1,
      offsetX: 0,
      offsetY: 0,
      padding: 20,
    },
    drivers: [],
    storedTimes: [],
    collisions: [],
    chat: [],
    serverLogs: [],
    updatedAt: new Date().toISOString(),
  };

  public start(): void {
    void this.connectWebSocket();
    void this.pollHttpDetails();
    this.detailsPollTimer = setInterval(() => {
      void this.pollHttpDetails();
    }, 10000);
  }

  public stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.detailsPollTimer) {
      clearInterval(this.detailsPollTimer);
      this.detailsPollTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
  }

  private cleanCarModel(carModel: string): string {
    if (!carModel) return 'Auto';
    return carModel
      .replace(/^ks_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  public getState(): LiveTelemetryState {
    const drivers = Array.from(this.driversByGuid.values())
      .map((d) => ({
        ...d,
        laps: this.driverLapsMap.get(d.guid) || [],
      }))
      .sort((a, b) => (a.position || 999) - (b.position || 999));

    return {
      ...this.state,
      drivers,
      storedTimes: this.storedTimesList,
      collisions: this.collisionsList.slice(0, 20),
      chat: this.chatList.slice(0, 60),
      serverLogs: this.serverLogList.slice(0, 60),
      updatedAt: new Date().toISOString(),
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitUpdate(): void {
    this.recomputeFlags();
    if (this.listeners.size === 0) return;
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Ignore broken listener
      }
    }
  }

  private recomputeFlags(): void {
    const now = Date.now();
    const drivers = Array.from(this.driversByGuid.values());
    const yellowSectorsSet = new Set<number>();
    let hasCheckered = false;
    let hasBlue = false;

    for (const d of drivers) {
      if (d.hasCompletedSession) hasCheckered = true;
      if (d.blueFlag) hasBlue = true;
      // Driver stopped or moving very slowly (< 25 km/h) on track outside pits
      if (!d.isInPits && d.hasPosition && d.speedKmh < 25 && (d.worldX !== 0 || d.worldZ !== 0)) {
        d.yellowFlag = true;
        yellowSectorsSet.add(d.currentSector || 1);
      } else {
        d.yellowFlag = false;
      }
    }

    // Recent collision in the last 12 seconds also triggers Yellow Flag in that sector
    for (const c of this.collisionsList) {
      if (now - c.epochMs <= 12000) {
        yellowSectorsSet.add(c.sector || 1);
      }
    }

    const yellowSectors = Array.from(yellowSectorsSet).sort();
    this.state.yellowSectors = yellowSectors;

    if (hasCheckered) {
      this.state.trackFlag = 'checkered';
      this.state.trackFlagTitle = 'BANDERA A CUADROS';
      this.state.trackFlagSubtitle = 'Sesión finalizada';
    } else if (yellowSectors.length > 0) {
      this.state.trackFlag = 'yellow';
      this.state.trackFlagTitle = `BANDERA AMARILLA — SECTOR ${yellowSectors.join(', ')}`;
      this.state.trackFlagSubtitle = 'Precaución: vehículo lento o incidente en pista';
    } else if (hasBlue) {
      this.state.trackFlag = 'blue';
      this.state.trackFlagTitle = 'BANDERA AZUL EN PISTA';
      this.state.trackFlagSubtitle = 'Ceder el paso a un vehículo más rápido';
    } else {
      this.state.trackFlag = 'green';
      this.state.trackFlagTitle = 'BANDERA VERDE';
      this.state.trackFlagSubtitle = 'Pista libre en todos los sectores';
    }
  }

  private async pollHttpDetails(): Promise<void> {
    try {
      const status = await emperorService.getLiveStatus();
      this.state.serverName = status.serverName;
      if (typeof status.ambientTemp === 'number') this.state.ambientTemp = status.ambientTemp;
      if (typeof status.roadTemp === 'number') this.state.roadTemp = status.roadTemp;

      if (!this.state.trackId && status.rawTrackId) {
        this.state.trackId = status.rawTrackId;
        this.state.trackLayout = status.trackConfig || '';
        this.updateTrackUrls();
      }
    } catch {
      // Keep cached values
    }
  }

  private updateTrackUrls(): void {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    const trackPath = this.state.trackLayout
      ? `${this.state.trackId}/${this.state.trackLayout}`
      : this.state.trackId;

    if (trackPath) {
      this.state.mapImageUrl = `${base}/content/tracks/${trackPath}/map.png`;
      this.state.previewImageUrl = `${base}/content/tracks/${trackPath}/ui/preview.png`;
    }
  }

  private async connectWebSocket(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const res = await fetch(`${base}/live-timing`, {
        headers: {
          'User-Agent': userAgent,
        },
        signal: AbortSignal.timeout(8000),
      });

      let rawCookie = '';
      if (typeof res.headers.getSetCookie === 'function') {
        const cookies = res.headers.getSetCookie();
        if (cookies && cookies[0]) {
          rawCookie = cookies[0].split(';')[0];
        }
      }
      if (!rawCookie) {
        const headerCookie = res.headers.get('set-cookie');
        if (headerCookie) {
          rawCookie = headerCookie.split(';')[0];
        }
      }

      const wsUrl = base.replace(/^http/, 'ws') + '/api/race-control';

      const ws = new WebSocket(wsUrl, {
        headers: {
          Cookie: rawCookie,
          Origin: base,
          'User-Agent': userAgent,
        },
      });

      this.ws = ws;

      ws.onopen = () => {
        this.state.connectedToWs = true;
        console.log('🌐 Conectado exitosamente al WebSocket de Live Timing & Mapa de Emperor');
        this.emitUpdate();
      };

      ws.onmessage = (event: { data: unknown }) => {
        try {
          const payload = JSON.parse(String(event.data));
          this.handleWsEvent(payload);
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onclose = (ev: { code?: number; reason?: string }) => {
        console.warn(`⚠️ WebSocket cerrado (código: ${ev?.code}, razón: ${ev?.reason || 'desconocida'})`);
        this.state.connectedToWs = false;
        this.scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.error('❌ Error en WebSocket de Emperor:', err);
        this.state.connectedToWs = false;
      };
    } catch (err) {
      console.error('❌ Error iniciando WebSocket con Emperor:', err);
      this.state.connectedToWs = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectWebSocket();
    }, 5000);
  }

  private translateWorldToMap(worldX: number, worldZ: number): {
    pixelX: number;
    pixelY: number;
    percentX: number;
    percentY: number;
  } {
    const { offsetX, offsetY, scaleFactor, padding, width, height } = this.state.mapData;
    const scale = scaleFactor > 0 ? scaleFactor : 1;
    const w = width > 0 ? width : 1600;
    const h = height > 0 ? height : 1600;

    // Exact Emperor formula: ((worldCoord + offset) / scaleFactor + padding)
    const pixelX = (worldX + offsetX) / scale + padding;
    const pixelY = (worldZ + offsetY) / scale + padding;

    const percentX = Math.max(0, Math.min(100, (pixelX / w) * 100));
    const percentY = Math.max(0, Math.min(100, (pixelY / h) * 100));

    return {
      pixelX: Math.round(pixelX * 10) / 10,
      pixelY: Math.round(pixelY * 10) / 10,
      percentX: Math.round(percentX * 1000) / 1000,
      percentY: Math.round(percentY * 1000) / 1000,
    };
  }

  private formatNsLap(ns: number): string {
    if (!ns || ns <= 0) return 'Sin tiempo';
    const ms = Math.round(ns / 1_000_000);
    return emperorService.formatLapTime(ms);
  }

  private formatDeltaMs(deltaMs: number): string {
    if (!deltaMs || !Number.isFinite(deltaMs)) return '0.000s';
    const sec = deltaMs / 1000;
    const sign = sec > 0 ? '+' : '';
    return `${sign}${sec.toFixed(3)}s`;
  }

  private sectorFromSpline(spline: number): number {
    if (!spline || spline < 0.333) return 1;
    if (spline < 0.666) return 2;
    return 3;
  }

  private formatGear(rawGear: number): string {
    const g = rawGear - 1;
    if (g < 0) return 'R';
    if (g === 0) return 'N';
    return String(g);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleWsEvent(payload: any): void {
    const eventType = payload?.EventType;
    const msg = payload?.Message;
    if (!msg) return;

    // EventType 57 = Live Game Chat Message
    if (eventType === 57) {
      const cd = new Date(msg.Time || Date.now());
      const chatItem: LiveChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: msg.Time || cd.toISOString(),
        timeFormatted: cd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        driverGuid: String(msg.DriverGUID || ''),
        driverName: String(msg.DriverName || 'Servidor'),
        message: String(msg.Message || ''),
      };
      this.chatList.unshift(chatItem);
      if (this.chatList.length > 100) this.chatList.length = 100;
      this.emitUpdate();
      return;
    }

    // EventType 110 = Steward / Penalty / Infraction Log
    if (eventType === 110) {
      const cd = new Date(msg.time || Date.now());
      const logItem: LiveServerLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: msg.time || cd.toISOString(),
        timeFormatted: cd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: String(msg.type || 'Sanción'),
        name: String(msg.name || ''),
        driverName: String(msg.driver_name || ''),
        carModel: String(msg.car_model || ''),
        lap: msg.lap ?? 0,
        triggeredBy: String(msg.triggered_by || 'Race Control'),
        context: String(msg.context || ''),
      };
      this.serverLogList.unshift(logItem);
      if (this.serverLogList.length > 100) this.serverLogList.length = 100;
      this.emitUpdate();
      return;
    }

    // EventType 200 = Full initial RaceControl state
    if (eventType === 200) {
      if (typeof msg.CurrentRealtimePosInterval === 'number' && msg.CurrentRealtimePosInterval > 0) {
        this.state.realtimePosIntervalMs = msg.CurrentRealtimePosInterval;
      }

      const sessionInfo = msg.SessionInfo || {};
      const trackInfo = msg.TrackInfo || {};
      const mapData = msg.TrackMapData || {};

      this.state.trackId = sessionInfo.Track || this.state.trackId;
      this.state.trackLayout = sessionInfo.TrackConfig || '';
      this.state.trackTitle = trackInfo.name || this.state.trackId;
      this.state.trackCity = trackInfo.city || '';
      this.state.trackCountry = trackInfo.country || '';
      this.state.trackLength = trackInfo.length || '';
      this.state.sessionDurationMinutes = Number(sessionInfo.Time ?? 0);
      this.state.sessionWaitTimeSeconds = Number(sessionInfo.WaitTime ?? 0);
      this.state.sessionLaps = Number(sessionInfo.Laps ?? 0);
      this.state.ambientTemp = Number(sessionInfo.AmbientTemp ?? this.state.ambientTemp);
      this.state.roadTemp = Number(sessionInfo.RoadTemp ?? this.state.roadTemp);

      const sessionTypeMap: Record<number, string> = {
        0: 'Reserva',
        1: 'Práctica',
        2: 'Clasificación',
        3: 'Carrera',
      };
      this.state.sessionType = sessionTypeMap[Number(sessionInfo.Type)] || 'Práctica';

      if (msg.SessionStartTime) {
        this.state.sessionStartTime = new Date(msg.SessionStartTime).toISOString();
        const startMs = new Date(msg.SessionStartTime).getTime();
        if (!Number.isNaN(startMs)) {
          this.state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        }
      }

      // Initial chat messages
      if (Array.isArray(msg.ChatMessages) && msg.ChatMessages.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.chatList = msg.ChatMessages.map((c: any, i: number) => {
          const cd = new Date(c.Time || Date.now());
          return {
            id: `chat-init-${i}`,
            time: c.Time || cd.toISOString(),
            timeFormatted: cd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            driverGuid: String(c.DriverGUID || ''),
            driverName: String(c.DriverName || 'Servidor'),
            message: String(c.Message || ''),
          };
        }).reverse();
      }

      this.state.mapData = {
        width: Number(mapData.width ?? 1600),
        height: Number(mapData.height ?? 1600),
        margin: Number(mapData.margin ?? 20),
        scaleFactor: Number(mapData.scale_factor ?? 1),
        offsetX: Number(mapData.offset_x ?? 0),
        offsetY: Number(mapData.offset_y ?? 0),
        padding: Number(mapData.padding ?? 20),
      };

      this.updateTrackUrls();

      // CarID -> GUID map
      this.carIdToGuid.clear();
      if (msg.CarIDToGUID && typeof msg.CarIDToGUID === 'object') {
        for (const [carIdStr, guid] of Object.entries(msg.CarIDToGUID)) {
          this.carIdToGuid.set(Number(carIdStr), String(guid));
        }
      }

      // Connected drivers
      this.driversByGuid.clear();
      const connectedDrivers = msg.ConnectedDrivers?.Drivers || {};
      const order: string[] = msg.ConnectedDrivers?.GUIDsInPositionalOrder || Object.keys(connectedDrivers);

      order.forEach((guid, idx) => {
        const d = connectedDrivers[guid];
        if (!d) return;
        const carInfo = d.CarInfo || {};
        const carModel = carInfo.CarModel || '';
        const carStats = d.Cars?.[carModel] || {};
        const lastPos = d.LastPos || { X: 0, Y: 0, Z: 0 };
        const worldX = Number(lastPos.X ?? 0);
        const worldZ = Number(lastPos.Z ?? 0);
        const hasPosition = worldX !== 0 || worldZ !== 0;
        const coords = this.translateWorldToMap(worldX, worldZ);

        const bestLapNs = Number(carStats.BestLap ?? 0);
        const lastLapNs = Number(carStats.LastLap ?? 0);
        const carId = Number(carInfo.CarID ?? idx);
        this.carIdToGuid.set(carId, guid);

        const spline = Number(d.NormalisedSplinePos ?? 0);
        const steerAngle = Number(d.SteerAngle ?? 127);
        const bestLapMs = bestLapNs > 0 ? Math.round(bestLapNs / 1_000_000) : 0;

        // Initialize driver laps
        let driverLaps = this.driverLapsMap.get(guid);
        if (!driverLaps) {
          driverLaps = [];
          if (bestLapMs > 0) {
            driverLaps.push({
              lapNumber: Number(carStats.NumLaps ?? 1),
              lapTimeMs: bestLapMs,
              lapFormatted: this.formatNsLap(bestLapNs),
              isPersonalBest: true,
              topSpeedKmh: Math.round(Number(carStats.TopSpeedBestLap ?? 0)),
              tyre: carInfo.Tyres || '-',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
          }
          this.driverLapsMap.set(guid, driverLaps);
        }

        this.driversByGuid.set(guid, {
          guid,
          carId,
          name: carInfo.DriverName || 'Piloto',
          initials: carInfo.DriverInitials || (carInfo.DriverName || 'P').slice(0, 3).toUpperCase(),
          raceNumber: Number(carInfo.RaceNumber ?? 0),
          carModel,
          carName: carInfo.CarName || this.cleanCarModel(carModel),
          tyres: carInfo.Tyres || '-',
          position: Number(d.Position && d.Position !== 255 ? d.Position : idx + 1),
          isInPits: Boolean(d.IsInPits),
          ping: Number(d.Ping ?? 0),
          speedKmh: 0,
          topSpeedKmh: Math.round(Number(carStats.TopSpeedBestLap ?? 0)),
          gear: 1,
          gearDisplay: 'N',
          rpm: 0,
          maxRpm: 8000,
          rpmPct: 0,
          steerAngle,
          steerDeg: steerAngle === 0 ? 0 : Math.round((steerAngle - 127) * 1.4173),
          throttlePct: 0,
          brakePct: 0,
          longitudinalG: 0,
          drsActive: Boolean(d.DRSActive),
          blueFlag: Boolean(d.BlueFlag),
          yellowFlag: false,
          hasCompletedSession: Boolean(d.HasCompletedSession),
          currentSector: this.sectorFromSpline(spline),
          splinePct: Math.round(spline * 1000) / 10,
          deltaToBestMs: Number(d.DeltaToBest ?? 0),
          deltaToSelfMs: Number(d.DeltaToSelf ?? 0),
          deltaToBestFormatted: this.formatDeltaMs(Number(d.DeltaToBest ?? 0)),
          deltaToSelfFormatted: this.formatDeltaMs(Number(d.DeltaToSelf ?? 0)),
          headingDeg: 0,
          numLaps: Number(carStats.NumLaps ?? d.TotalNumLaps ?? 0),
          bestLapMs,
          bestLapFormatted: this.formatNsLap(bestLapNs),
          lastLapFormatted: this.formatNsLap(lastLapNs),
          gap: d.Split || '00:00.000',
          ballast: Number(d.Ballast ?? 0),
          restrictor: Number(d.Restrictor ?? 0),
          incidentsCount: 0,
          hasPosition,
          worldX,
          worldZ,
          mapPixelX: coords.pixelX,
          mapPixelY: coords.pixelY,
          mapPercentX: coords.percentX,
          mapPercentY: coords.percentY,
          color: DRIVER_COLORS[idx % DRIVER_COLORS.length]!,
          laps: driverLaps,
        });
      });

      // Stored times from ConnectedDrivers + DisconnectedDrivers
      const storedMap = new Map<string, StoredSessionTime>();
      const collectStored = (driversObj: Record<string, unknown>, isOnline: boolean) => {
        for (const [guid, rawDriver] of Object.entries(driversObj || {})) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = rawDriver as any;
          if (!d?.CarInfo || !d?.Cars) continue;
          for (const [carModel, rawCarStats] of Object.entries(d.Cars)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cs = rawCarStats as any;
            const numLaps = Number(cs?.NumLaps ?? 0);
            const bestLapNs = Number(cs?.BestLap ?? 0);
            if (numLaps <= 0 && bestLapNs <= 0) continue;
            const lastLapNs = Number(cs?.LastLap ?? 0);
            storedMap.set(`${guid}_${carModel}`, {
              guid,
              name: d.CarInfo.DriverName || 'Piloto',
              carModel,
              carName: cs?.CarName || d.CarInfo.CarName || this.cleanCarModel(carModel),
              tyres: cs?.TyreBestLap || d.CarInfo.Tyres || '-',
              bestLapMs: bestLapNs > 0 ? Math.round(bestLapNs / 1_000_000) : 0,
              bestLapFormatted: this.formatNsLap(bestLapNs),
              lastLapFormatted: this.formatNsLap(lastLapNs),
              numLaps,
              topSpeedKmh: Math.round(Number(cs?.TopSpeedBestLap ?? 0)),
              isOnline,
            });
          }
        }
      };

      collectStored(msg.DisconnectedDrivers?.Drivers || {}, false);
      collectStored(connectedDrivers, true);

      this.storedTimesList = Array.from(storedMap.values()).sort((a, b) => {
        if (a.bestLapMs > 0 && b.bestLapMs > 0) return a.bestLapMs - b.bestLapMs;
        if (a.bestLapMs > 0) return -1;
        if (b.bestLapMs > 0) return 1;
        return b.numLaps - a.numLaps;
      });

      this.emitUpdate();
      return;
    }

    // EventType 51 = Driver Connected / Updated, 101 = Tyre change, 109 = CarInfo update
    if (eventType === 51 || eventType === 101 || eventType === 109) {
      const guid = String(msg.DriverGUID || '');
      if (!guid) return;
      const carId = Number(msg.CarID ?? 0);
      this.carIdToGuid.set(carId, guid);

      const existing = this.driversByGuid.get(guid);
      const idx = this.driversByGuid.size;
      const carModel = msg.CarModel || existing?.carModel || '';
      const driverLaps = this.driverLapsMap.get(guid) || [];

      if (!existing && eventType === 51) {
        this.serverLogList.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'Conexión',
          name: 'Piloto conectado a la sesión',
          driverName: msg.DriverName || 'Piloto',
          carModel,
          lap: 0,
          triggeredBy: 'Servidor',
          context: 'Ingreso al pitlane',
        });
        if (this.serverLogList.length > 100) this.serverLogList.length = 100;
      }

      this.driversByGuid.set(guid, {
        guid,
        carId,
        name: msg.DriverName || existing?.name || 'Piloto',
        initials: msg.DriverInitials || existing?.initials || 'PIL',
        raceNumber: Number(msg.RaceNumber ?? existing?.raceNumber ?? 0),
        carModel,
        carName: msg.CarName || existing?.carName || this.cleanCarModel(carModel),
        tyres: msg.Tyres || existing?.tyres || '-',
        position: existing?.position || idx + 1,
        isInPits: existing?.isInPits ?? true,
        ping: existing?.ping ?? 0,
        speedKmh: existing?.speedKmh ?? 0,
        topSpeedKmh: existing?.topSpeedKmh ?? 0,
        gear: existing?.gear ?? 1,
        gearDisplay: existing?.gearDisplay || 'N',
        rpm: existing?.rpm ?? 0,
        maxRpm: existing?.maxRpm ?? 8000,
        rpmPct: existing?.rpmPct ?? 0,
        steerAngle: existing?.steerAngle ?? 0,
        steerDeg: existing?.steerDeg ?? 0,
        throttlePct: 0,
        brakePct: 0,
        longitudinalG: 0,
        drsActive: existing?.drsActive ?? false,
        blueFlag: existing?.blueFlag ?? false,
        yellowFlag: existing?.yellowFlag ?? false,
        hasCompletedSession: existing?.hasCompletedSession ?? false,
        currentSector: existing?.currentSector ?? 1,
        splinePct: existing?.splinePct ?? 0,
        deltaToBestMs: existing?.deltaToBestMs ?? 0,
        deltaToSelfMs: existing?.deltaToSelfMs ?? 0,
        deltaToBestFormatted: existing?.deltaToBestFormatted ?? '0.000s',
        deltaToSelfFormatted: existing?.deltaToSelfFormatted ?? '0.000s',
        headingDeg: existing?.headingDeg ?? 0,
        numLaps: existing?.numLaps ?? 0,
        bestLapMs: existing?.bestLapMs ?? 0,
        bestLapFormatted: existing?.bestLapFormatted ?? 'Sin tiempo',
        lastLapFormatted: existing?.lastLapFormatted ?? 'Sin tiempo',
        gap: existing?.gap ?? '00:00.000',
        ballast: existing?.ballast ?? 0,
        restrictor: existing?.restrictor ?? 0,
        incidentsCount: existing?.incidentsCount ?? 0,
        hasPosition: existing?.hasPosition ?? false,
        worldX: existing?.worldX ?? 0,
        worldZ: existing?.worldZ ?? 0,
        mapPixelX: existing?.mapPixelX ?? 0,
        mapPixelY: existing?.mapPixelY ?? 0,
        mapPercentX: existing?.mapPercentX ?? 0,
        mapPercentY: existing?.mapPercentY ?? 0,
        color: existing?.color || DRIVER_COLORS[idx % DRIVER_COLORS.length]!,
        laps: driverLaps,
      });
      this.emitUpdate();
      return;
    }

    // EventType 52 = Driver Disconnected
    if (eventType === 52) {
      const guid = String(msg.DriverGUID || '');
      if (guid) {
        const driver = this.driversByGuid.get(guid);
        this.serverLogList.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'Desconexión',
          name: 'Piloto abandonó la sesión',
          driverName: driver?.name || 'Piloto',
          carModel: driver?.carModel || '',
          lap: driver?.numLaps || 0,
          triggeredBy: 'Servidor',
          context: 'Salió del servidor',
        });
        if (this.serverLogList.length > 100) this.serverLogList.length = 100;

        this.driversByGuid.delete(guid);
        this.prevPhysicsByGuid.delete(guid);
        this.emitUpdate();
      }
      return;
    }

    // EventType 108 = Collision Event (aH in Emperor)
    if (eventType === 108) {
      const guid = String(msg.DriverGUID || '');
      const driver = this.driversByGuid.get(guid);
      const worldX = Number(msg.WorldPos?.X ?? driver?.worldX ?? 0);
      const worldZ = Number(msg.WorldPos?.Z ?? driver?.worldZ ?? 0);
      const coords = this.translateWorldToMap(worldX, worldZ);
      const speedKmh = Math.round(Number(msg.Speed ?? 0) * 10) / 10;
      const isWithCar = msg.Type === 'with other car';
      const otherDriverName = String(msg.OtherDriverName || '');
      const rawZones = Array.isArray(msg.DamageZones) ? msg.DamageZones : [0, 0, 0, 0];
      const damageZones: [number, number, number, number] = [
        Number(rawZones[0] ?? 0),
        Number(rawZones[1] ?? 0),
        Number(rawZones[2] ?? 0),
        Number(rawZones[3] ?? 0),
      ];

      if (driver) {
        driver.incidentsCount = (driver.incidentsCount || 0) + 1;
      }

      const now = new Date();
      const collision: LiveCollisionEvent = {
        id: `${guid}-${msg.ID ?? now.getTime()}`,
        timestamp: msg.Time || now.toISOString(),
        timeFormatted: now.toLocaleTimeString(),
        epochMs: now.getTime(),
        driverGuid: guid,
        driverName: driver?.name || String(msg.DriverName || 'Piloto'),
        carName: driver?.carName || '',
        otherDriverName,
        type: isWithCar ? 'car' : 'environment',
        typeLabel: isWithCar
          ? `Choque con ${otherDriverName || 'otro vehículo'}`
          : 'Impacto contra muro / entorno',
        speedKmh,
        sector: driver?.currentSector || 1,
        worldX,
        worldZ,
        mapPercentX: coords.percentX,
        mapPercentY: coords.percentY,
        damageZones,
      };

      this.collisionsList.unshift(collision);
      if (this.collisionsList.length > 30) {
        this.collisionsList.length = 30;
      }

      this.serverLogList.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: now.toISOString(),
        timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'Incidente',
        name: collision.typeLabel,
        driverName: collision.driverName,
        carModel: driver?.carModel || '',
        lap: driver?.numLaps || 0,
        triggeredBy: 'Detección física',
        context: `${speedKmh} km/h • Sector ${collision.sector}`,
      });
      if (this.serverLogList.length > 100) this.serverLogList.length = 100;

      this.emitUpdate();
      return;
    }

    // EventType 53 = Real-time Car Telemetry & World Position Update
    if (eventType === 53) {
      const updates = Array.isArray(msg) ? msg : [msg];
      const nowMs = Date.now();

      for (const update of updates) {
        if (!update || typeof update !== 'object') continue;
        const carId = typeof update.CarID === 'number' ? update.CarID : 0;
        let guid = this.carIdToGuid.get(carId);
        if (!guid && this.driversByGuid.size === 1) {
          guid = Array.from(this.driversByGuid.keys())[0];
        }
        if (!guid) continue;

        const driver = this.driversByGuid.get(guid);
        if (!driver) continue;

        const worldX = Number(update.Pos?.X ?? driver.worldX);
        const worldZ = Number(update.Pos?.Z ?? driver.worldZ);
        const coords = this.translateWorldToMap(worldX, worldZ);

        const vx = Number(update.Velocity?.X ?? 0);
        const vz = Number(update.Velocity?.Z ?? 0);
        const speedMps = Math.sqrt(vx * vx + vz * vz);
        const speedKmh = Math.floor(speedMps * 3.6);

        const rpm = Math.round(Number(update.EngineRPM ?? driver.rpm));
        const maxRpm = Math.max(driver.maxRpm || 7500, rpm, 6500);
        const rpmPct = Math.min(100, Math.max(0, Math.round((rpm / maxRpm) * 100)));

        const steerAngle = Number(update.SteerAngle ?? driver.steerAngle);
        driver.steerAngle = steerAngle;
        driver.steerDeg = Math.round(steerAngle * 1.417);

        driver.worldX = worldX;
        driver.worldZ = worldZ;
        driver.hasPosition = worldX !== 0 || worldZ !== 0;
        driver.mapPixelX = coords.pixelX;
        driver.mapPixelY = coords.pixelY;
        driver.mapPercentX = coords.percentX;
        driver.mapPercentY = coords.percentY;
        driver.speedKmh = speedKmh;
        if (speedKmh > driver.topSpeedKmh) {
          driver.topSpeedKmh = speedKmh;
        }

        const rawGear = Number(update.Gear ?? driver.gear);
        driver.gear = rawGear;
        driver.gearDisplay = this.formatGear(rawGear);
        driver.rpm = rpm;
        driver.maxRpm = maxRpm;
        driver.rpmPct = rpmPct;
        driver.throttlePct = 0;
        driver.brakePct = 0;
        driver.longitudinalG = 0;
        driver.drsActive = Boolean(update.DRSActive ?? driver.drsActive);
        driver.blueFlag = Boolean(update.BlueFlag ?? false);
        driver.hasCompletedSession = Boolean(update.HasCompletedSession ?? driver.hasCompletedSession);

        const spline = Number(update.NormalisedSplinePos ?? 0);
        driver.currentSector = this.sectorFromSpline(spline);
        driver.splinePct = Math.round(spline * 1000) / 10;

        driver.deltaToBestMs = Number(update.DeltaToBest ?? driver.deltaToBestMs);
        driver.deltaToSelfMs = Number(update.DeltaToSelf ?? driver.deltaToSelfMs);
        driver.deltaToBestFormatted = this.formatDeltaMs(driver.deltaToBestMs);
        driver.deltaToSelfFormatted = this.formatDeltaMs(driver.deltaToSelfMs);

        driver.isInPits = Boolean(update.IsInPits ?? driver.isInPits);
        driver.ping = Number(update.Ping ?? driver.ping);
        driver.ballast = Number(update.Ballast ?? driver.ballast);
        driver.restrictor = Number(update.Restrictor ?? driver.restrictor);

        if (update.RacePosition && update.RacePosition !== 255) {
          driver.position = Number(update.RacePosition);
        }
        if (update.Gap) {
          driver.gap = String(update.Gap);
        }
        if (update.Rotation && typeof update.Rotation.X === 'number') {
          driver.headingDeg = Math.round(180 + update.Rotation.X * (180 / Math.PI));
        }

        // Lap completed check
        if (typeof update.TotalNumLaps === 'number' && update.TotalNumLaps > driver.numLaps) {
          driver.numLaps = update.TotalNumLaps;
          const lapMs = Math.round(Number(update.LastLap ?? 0) / 1_000_000);
          if (lapMs > 0) {
            const laps = this.driverLapsMap.get(guid) || [];
            const isPB = driver.bestLapMs > 0 && lapMs <= driver.bestLapMs;
            laps.unshift({
              lapNumber: driver.numLaps,
              lapTimeMs: lapMs,
              lapFormatted: emperorService.formatLapTime(lapMs),
              isPersonalBest: isPB,
              topSpeedKmh: driver.speedKmh,
              tyre: driver.tyres || '-',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
            this.driverLapsMap.set(guid, laps);
            driver.laps = laps;
          }
        }
      }

      this.emitUpdate();
    }
  }
}

export const liveTimingService = new LiveTimingService();
