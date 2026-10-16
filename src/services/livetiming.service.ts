import { env } from '../config/env.js';
import { emperorService } from './emperor.service.js';

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
  rpm: number;
  headingDeg: number;
  numLaps: number;
  bestLapMs: number;
  bestLapFormatted: string;
  lastLapFormatted: string;
  gap: string;
  hasPosition: boolean;
  worldX: number;
  worldZ: number;
  mapPixelX: number;
  mapPixelY: number;
  mapPercentX: number;
  mapPercentY: number;
  color: string;
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

export interface LiveTelemetryState {
  connectedToWs: boolean;
  serverName: string;
  trackId: string;
  trackLayout: string;
  trackTitle: string;
  trackCity: string;
  trackCountry: string;
  trackLength: string;
  sessionType: string;
  sessionDurationMinutes: number;
  elapsedSeconds: number;
  ambientTemp: number;
  roadTemp: number;
  joinUrl: string;
  password: string;
  mapImageUrl: string;
  previewImageUrl: string;
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

export class LiveTimingService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private driversByGuid = new Map<string, LiveMapDriver>();
  private storedTimesList: StoredSessionTime[] = [];
  private carIdToGuid = new Map<number, string>();

  private state: LiveTelemetryState = {
    connectedToWs: false,
    serverName: 'LATAM Simracing Alliance',
    trackId: 'rt_bathurst',
    trackLayout: '',
    trackTitle: 'Bathurst (Mount Panorama)',
    trackCity: 'Bathurst',
    trackCountry: 'Australia',
    trackLength: '6.213 km',
    sessionType: 'Practice',
    sessionDurationMinutes: 0,
    elapsedSeconds: 0,
    ambientTemp: 20,
    roadTemp: 40,
    joinUrl: emperorService.getContentManagerJoinButtonUrl(),
    password: env.AC_SERVER_PASSWORD,
    mapImageUrl: `${env.EMPEROR_WEB_URL.replace(/\/+$/, '')}/content/tracks/rt_bathurst/map.png`,
    previewImageUrl: `${env.EMPEROR_WEB_URL.replace(/\/+$/, '')}/content/tracks/rt_bathurst/ui/preview.png`,
    mapData: {
      width: 1680,
      height: 2606,
      margin: 10,
      scaleFactor: 0.8517315,
      offsetX: 980.519,
      offsetY: 622.651,
      padding: 40,
    },
    drivers: [],
    storedTimes: [],
    updatedAt: new Date().toISOString(),
  };

  public start(): void {
    void this.connectWebSocket();
  }

  public stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public getState(): LiveTelemetryState {
    return {
      ...this.state,
      drivers: [...this.driversByGuid.values()].sort(
        (a, b) => a.position - b.position
      ),
      storedTimes: this.storedTimesList,
      updatedAt: new Date().toISOString(),
    };
  }

  private async connectWebSocket(): Promise<void> {
    const baseWeb = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    const wsProtocol = baseWeb.startsWith('https') ? 'wss://' : 'ws://';
    const hostPart = baseWeb.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}${hostPart}/api/race-control`;

    try {
      const pageResp = await fetch(`${baseWeb}/live-timing`, {
        signal: AbortSignal.timeout(8000),
      });
      const cookies =
        typeof pageResp.headers.getSetCookie === 'function'
          ? pageResp.headers
              .getSetCookie()
              .map((c) => c.split(';')[0])
              .join('; ')
          : pageResp.headers.get('set-cookie') ?? '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ws: WebSocket = new (WebSocket as any)(wsUrl, {
        headers: {
          Cookie: cookies,
          Origin: baseWeb,
        },
      });

      this.ws = ws;

      ws.onopen = () => {
        this.state.connectedToWs = true;
        console.log('🌐 Conectado al WebSocket de Live Timing & Mapa de Emperor');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data));
          this.handleWsEvent(payload);
        } catch {
          // Ignorar paquetes malformados
        }
      };

      ws.onclose = () => {
        this.state.connectedToWs = false;
        this.scheduleReconnect();
      };

      ws.onerror = () => {
        this.state.connectedToWs = false;
      };
    } catch {
      this.state.connectedToWs = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectWebSocket();
    }, 8000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleWsEvent(packet: any): void {
    if (!packet || typeof packet.EventType !== 'number') return;

    const baseWeb = env.EMPEROR_WEB_URL.replace(/\/+$/, '');

    switch (packet.EventType) {
      // 200 = Estado inicial completo de Live Timing & Mapa
      case 200: {
        const msg = packet.Message;
        if (!msg) break;

        if (msg.SessionInfo) {
          const s = msg.SessionInfo;
          const rawTrack = s.Track || 'rt_bathurst';
          const rawConfig = s.TrackConfig || '';

          this.state.serverName = (
            s.ServerName || 'LATAM Simracing Alliance'
          ).replace(/\s*ℹ\d+$/, '');
          this.state.trackId = rawTrack;
          this.state.trackLayout = rawConfig;
          this.state.sessionType = this.mapSessionType(s.Type, s.Name);
          this.state.sessionDurationMinutes = Number(s.Time || 0);
          this.state.elapsedSeconds = Math.floor(
            Number(s.ElapsedMilliseconds || 0) / 1000
          );
          this.state.ambientTemp = Number(s.AmbientTemp || 20);
          this.state.roadTemp = Number(s.RoadTemp || 35);

          this.state.mapImageUrl = rawConfig
            ? `${baseWeb}/content/tracks/${rawTrack}/${rawConfig}/map.png`
            : `${baseWeb}/content/tracks/${rawTrack}/map.png`;
          this.state.previewImageUrl = rawConfig
            ? `${baseWeb}/content/tracks/${rawTrack}/${rawConfig}/ui/preview.png`
            : `${baseWeb}/content/tracks/${rawTrack}/ui/preview.png`;
        }

        if (msg.TrackInfo) {
          this.state.trackTitle =
            msg.TrackInfo.name ||
            emperorService.formatIdentifier(this.state.trackId);
          this.state.trackCity = msg.TrackInfo.city || '';
          this.state.trackCountry = msg.TrackInfo.country || '';
          this.state.trackLength = msg.TrackInfo.length || '';
        }

        if (msg.TrackMapData) {
          this.state.mapData = {
            width: Number(msg.TrackMapData.width || 1680),
            height: Number(msg.TrackMapData.height || 2606),
            margin: Number(msg.TrackMapData.margin ?? 10),
            scaleFactor: Number(msg.TrackMapData.scale_factor || 1),
            offsetX: Number(msg.TrackMapData.offset_x || 0),
            offsetY: Number(msg.TrackMapData.offset_y || 0),
            padding: Number(msg.TrackMapData.padding ?? 40),
          };
        }

        this.carIdToGuid.clear();
        if (msg.CarIDToGUID && typeof msg.CarIDToGUID === 'object') {
          for (const [carIdStr, guid] of Object.entries(msg.CarIDToGUID)) {
            this.carIdToGuid.set(Number(carIdStr), String(guid));
          }
        }

        this.driversByGuid.clear();
        const rawDrivers = msg.ConnectedDrivers?.Drivers ?? {};
        let colorIdx = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const [guid, d] of Object.entries<any>(rawDrivers)) {
          const carInfo = d.CarInfo ?? {};
          const carModelRaw = carInfo.CarModel || '';
          const carStats = d.Cars?.[carModelRaw] ?? {};
          const pos = d.LastPos ?? {};
          const wx = Number(pos.X || 0);
          const wz = Number(pos.Z || 0);
          const hasPosition = wx !== 0 || wz !== 0;
          const coords = this.worldToMapCoords(wx, wz);

          const bestLapNsOrMs = Number(carStats.BestLap || 0);
          const lastLapNsOrMs = Number(carStats.LastLap || 0);
          const carId = Number(carInfo.CarID ?? 0);
          this.carIdToGuid.set(carId, guid);

          this.driversByGuid.set(guid, {
            guid,
            carId,
            name: carInfo.DriverName || 'Piloto',
            initials:
              carInfo.DriverInitials ||
              (carInfo.DriverName || 'PIL').slice(0, 3).toUpperCase(),
            raceNumber: Number(carInfo.RaceNumber || 0),
            carModel: emperorService.formatIdentifier(carModelRaw),
            carName:
              carInfo.CarName || emperorService.formatIdentifier(carModelRaw),
            tyres: carInfo.Tyres || '-',
            position: Number(d.Position || colorIdx + 1),
            isInPits: Boolean(d.IsInPits),
            ping: Number(d.Ping || 0),
            speedKmh: 0,
            topSpeedKmh: Math.round(Number(carStats.TopSpeedBestLap || 0)),
            gear: 0,
            rpm: 0,
            headingDeg: 0,
            numLaps: Number(carStats.NumLaps ?? d.TotalNumLaps ?? 0),
            bestLapMs: bestLapNsOrMs,
            bestLapFormatted:
              bestLapNsOrMs > 0
                ? emperorService.formatLapTime(bestLapNsOrMs)
                : 'Sin tiempo',
            lastLapFormatted:
              lastLapNsOrMs > 0
                ? emperorService.formatLapTime(lastLapNsOrMs)
                : '-',
            gap: String(d.Split || ''),
            hasPosition,
            worldX: wx,
            worldZ: wz,
            mapPixelX: coords.pixelX,
            mapPixelY: coords.pixelY,
            mapPercentX: coords.percentX,
            mapPercentY: coords.percentY,
            color: DRIVER_COLORS[colorIdx % DRIVER_COLORS.length],
          });
          colorIdx++;
        }

        // Extraer tiempos guardados de la sesión (Connected + Disconnected)
        this.extractStoredSessionTimes(
          msg.ConnectedDrivers?.Drivers ?? {},
          msg.DisconnectedDrivers?.Drivers ?? {}
        );
        break;
      }

      // 51 = Nuevo piloto conectado
      case 51: {
        const info = packet.Message;
        if (!info || !info.DriverGUID) break;
        const guid = String(info.DriverGUID);
        const carId = typeof info.CarID === 'number' ? info.CarID : 0;
        this.carIdToGuid.set(carId, guid);

        const existing = this.driversByGuid.get(guid);
        if (existing) {
          existing.carId = carId;
          existing.carModel = emperorService.formatIdentifier(
            info.CarModel || existing.carModel
          );
          existing.tyres = info.Tyres || existing.tyres;
        } else {
          const idx = this.driversByGuid.size;
          this.driversByGuid.set(guid, {
            guid,
            carId,
            name: info.DriverName || 'Piloto',
            initials:
              info.DriverInitials ||
              (info.DriverName || 'PIL').slice(0, 3).toUpperCase(),
            raceNumber: Number(info.RaceNumber || 0),
            carModel: emperorService.formatIdentifier(info.CarModel || ''),
            carName:
              info.CarName ||
              emperorService.formatIdentifier(info.CarModel || ''),
            tyres: info.Tyres || '-',
            position: idx + 1,
            isInPits: true,
            ping: 0,
            speedKmh: 0,
            topSpeedKmh: 0,
            gear: 0,
            rpm: 0,
            headingDeg: 0,
            numLaps: 0,
            bestLapMs: 0,
            bestLapFormatted: 'Sin tiempo',
            lastLapFormatted: '-',
            gap: '',
            hasPosition: false,
            worldX: 0,
            worldZ: 0,
            mapPixelX: 0,
            mapPixelY: 0,
            mapPercentX: 50,
            mapPercentY: 50,
            color: DRIVER_COLORS[idx % DRIVER_COLORS.length],
          });
        }
        break;
      }

      // 101 / 109 = Cambio de neumáticos o CarInfo
      case 101:
      case 109: {
        const info = packet.Message;
        if (!info || !info.DriverGUID) break;
        const guid = String(info.DriverGUID);
        const carId = typeof info.CarID === 'number' ? info.CarID : 0;
        this.carIdToGuid.set(carId, guid);
        const driver = this.driversByGuid.get(guid);
        if (driver) {
          if (info.Tyres) driver.tyres = info.Tyres;
          if (info.CarModel) {
            driver.carModel = emperorService.formatIdentifier(info.CarModel);
          }
        }
        break;
      }

      // 52 = Piloto desconectado
      case 52: {
        const info = packet.Message;
        if (!info || !info.DriverGUID) break;
        this.driversByGuid.delete(String(info.DriverGUID));
        break;
      }

      // 53 = Posición y telemetría en tiempo real cada 800ms
      case 53: {
        const update = packet.Message;
        if (!update) break;

        // En Go (Emperor Server), CarID=0 puede omitirse por omitempty
        const carId = typeof update.CarID === 'number' ? update.CarID : 0;
        let guid = this.carIdToGuid.get(carId);

        // Si solo hay 1 piloto conectado y aún no se mapeó el CarID, asociarlo
        if (!guid && this.driversByGuid.size === 1) {
          const singleDriver = [...this.driversByGuid.values()][0];
          guid = singleDriver.guid;
          this.carIdToGuid.set(carId, guid);
        }

        if (!guid) break;
        const driver = this.driversByGuid.get(guid);
        if (!driver) break;

        if (update.Pos) {
          const wx = Number(update.Pos.X || 0);
          const wz = Number(update.Pos.Z || 0);
          if (wx !== 0 || wz !== 0) {
            const coords = this.worldToMapCoords(wx, wz);
            driver.hasPosition = true;
            driver.worldX = wx;
            driver.worldZ = wz;
            driver.mapPixelX = coords.pixelX;
            driver.mapPixelY = coords.pixelY;
            driver.mapPercentX = coords.percentX;
            driver.mapPercentY = coords.percentY;
          }
        }

        if (update.Velocity) {
          const vx = Number(update.Velocity.X || 0);
          const vz = Number(update.Velocity.Z || 0);
          driver.speedKmh = Math.floor(Math.sqrt(vx * vx + vz * vz) * 3.6);
          if (driver.speedKmh > driver.topSpeedKmh) {
            driver.topSpeedKmh = driver.speedKmh;
          }
        }

        if (update.Rotation && typeof update.Rotation.X === 'number') {
          driver.headingDeg = Math.round(
            180 + update.Rotation.X * (180 / Math.PI)
          );
        }

        if (typeof update.Gear === 'number') {
          driver.gear = update.Gear;
        }
        if (typeof update.EngineRPM === 'number') {
          driver.rpm = update.EngineRPM;
        }
        if (typeof update.IsInPits === 'boolean') {
          driver.isInPits = update.IsInPits;
        }
        if (typeof update.Ping === 'number') {
          driver.ping = update.Ping;
        }
        if (typeof update.Gap === 'string') {
          driver.gap = update.Gap;
        }
        break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractStoredSessionTimes(connected: any, disconnected: any): void {
    const entries: StoredSessionTime[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processGroup = (group: any, isOnline: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [guid, d] of Object.entries<any>(group || {})) {
        const driverName = d.CarInfo?.DriverName || 'Piloto';
        const carsObj = d.Cars || {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const [carModelRaw, stats] of Object.entries<any>(carsObj)) {
          const numLaps = Number(stats.NumLaps || 0);
          const bestLap = Number(stats.BestLap || 0);
          const lastLap = Number(stats.LastLap || 0);
          if (numLaps <= 0 && bestLap <= 0 && !isOnline) continue;

          entries.push({
            guid: `${guid}_${carModelRaw}`,
            name: driverName,
            carModel: emperorService.formatIdentifier(carModelRaw),
            carName:
              stats.CarName || emperorService.formatIdentifier(carModelRaw),
            tyres: stats.TyreBestLap || d.CarInfo?.Tyres || '-',
            bestLapMs: bestLap > 10_000_000 ? Math.floor(bestLap / 1_000_000) : bestLap,
            bestLapFormatted:
              bestLap > 0 ? emperorService.formatLapTime(bestLap) : 'Sin tiempo',
            lastLapFormatted:
              lastLap > 0 ? emperorService.formatLapTime(lastLap) : '-',
            numLaps,
            topSpeedKmh: Math.round(Number(stats.TopSpeedBestLap || 0)),
            isOnline,
          });
        }
      }
    };

    processGroup(connected, true);
    processGroup(disconnected, false);

    entries.sort((a, b) => {
      const aTime = a.bestLapMs > 0 ? a.bestLapMs : 999_999_999;
      const bTime = b.bestLapMs > 0 ? b.bestLapMs : 999_999_999;
      return aTime - bTime;
    });

    this.storedTimesList = entries;
  }

  /**
   * Fórmula exacta de Emperor Server (`translateToTrackCoordinate` en `server-manager.js`):
   * En `server-manager.js`, `this.trackMargin` es `0`:
   *   pixelX = (worldX + offset_x) / scale_factor + padding
   *   pixelZ = (worldZ + offset_y) / scale_factor + padding
   * Además calculamos el porcentaje exacto (0% a 100%) respecto de `width` y `height` del PNG.
   */
  private worldToMapCoords(
    worldX: number,
    worldZ: number
  ): {
    pixelX: number;
    pixelY: number;
    percentX: number;
    percentY: number;
  } {
    const { width, height, offsetX, offsetY, scaleFactor, padding } =
      this.state.mapData;
    const safeScale = scaleFactor > 0 ? scaleFactor : 1;
    const safeW = width > 0 ? width : 1680;
    const safeH = height > 0 ? height : 2606;

    const pixelX = (worldX + offsetX) / safeScale + padding;
    const pixelY = (worldZ + offsetY) / safeScale + padding;

    const percentX = Math.max(0, Math.min(100, (pixelX / safeW) * 100));
    const percentY = Math.max(0, Math.min(100, (pixelY / safeH) * 100));

    return {
      pixelX: Math.round(pixelX * 10) / 10,
      pixelY: Math.round(pixelY * 10) / 10,
      percentX: Math.round(percentX * 1000) / 1000,
      percentY: Math.round(percentY * 1000) / 1000,
    };
  }

  private mapSessionType(
    typeNum: number | undefined,
    fallbackName?: string
  ): string {
    switch (typeNum) {
      case 0:
        return 'Booking';
      case 1:
        return 'Practice';
      case 2:
        return 'Qualy';
      case 3:
        return 'Race';
      default:
        return fallbackName || 'Practice';
    }
  }
}

export const liveTimingService = new LiveTimingService();
