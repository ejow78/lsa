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
  gear: number;
  rpm: number;
  headingDeg: number;
  numLaps: number;
  bestLapMs: number;
  bestLapFormatted: string;
  lastLapFormatted: string;
  worldX: number;
  worldZ: number;
  mapPixelX: number;
  mapPixelY: number;
  color: string;
}

export interface LiveTelemetryState {
  connectedToWs: boolean;
  serverName: string;
  trackId: string;
  trackLayout: string;
  trackTitle: string;
  trackCity: string;
  trackCountry: string;
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
  updatedAt: string;
}

const DRIVER_COLORS = [
  '#00f5d4',
  '#ffbe0b',
  '#ff006e',
  '#3a86ff',
  '#8338ec',
  '#fb5607',
  '#2ec4b6',
  '#e71d36',
  '#aacc00',
  '#00bbf9',
];

export class LiveTimingService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private driversByGuid = new Map<string, LiveMapDriver>();
  private carIdToGuid = new Map<number, string>();

  private state: LiveTelemetryState = {
    connectedToWs: false,
    serverName: 'LATAM Simracing Alliance',
    trackId: 'rt_bathurst',
    trackLayout: '',
    trackTitle: 'Bathurst (Mount Panorama)',
    trackCity: 'Bathurst',
    trackCountry: 'Australia',
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

      // @ts-expect-error Node 22 native WebSocket accepts headers in options
      const ws = new WebSocket(wsUrl, {
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

        for (const [guid, d] of Object.entries<any>(rawDrivers)) {
          const carInfo = d.CarInfo ?? {};
          const carModelRaw = carInfo.CarModel || '';
          const carStats = d.Cars?.[carModelRaw] ?? {};
          const pos = d.LastPos ?? { X: 0, Z: 0 };
          const coords = this.worldToMapPixel(
            Number(pos.X || 0),
            Number(pos.Z || 0)
          );

          const bestLapMs = Number(carStats.BestLap || 0);
          const lastLapMs = Number(carStats.LastLap || 0);
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
            gear: 0,
            rpm: 0,
            headingDeg: 0,
            numLaps: Number(carStats.NumLaps ?? d.TotalNumLaps ?? 0),
            bestLapMs,
            bestLapFormatted:
              bestLapMs > 0
                ? emperorService.formatLapTime(bestLapMs)
                : 'Sin tiempo',
            lastLapFormatted:
              lastLapMs > 0 ? emperorService.formatLapTime(lastLapMs) : '-',
            worldX: Number(pos.X || 0),
            worldZ: Number(pos.Z || 0),
            mapPixelX: coords.x,
            mapPixelY: coords.y,
            color: DRIVER_COLORS[colorIdx % DRIVER_COLORS.length],
          });
          colorIdx++;
        }
        break;
      }

      // 51 = Nuevo piloto conectado
      case 51: {
        const info = packet.Message;
        if (!info || !info.DriverGUID) break;
        const guid = String(info.DriverGUID);
        const carId = Number(info.CarID ?? 0);
        this.carIdToGuid.set(carId, guid);

        if (!this.driversByGuid.has(guid)) {
          const coords = this.worldToMapPixel(0, 0);
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
            gear: 0,
            rpm: 0,
            headingDeg: 0,
            numLaps: 0,
            bestLapMs: 0,
            bestLapFormatted: 'Sin tiempo',
            lastLapFormatted: '-',
            worldX: 0,
            worldZ: 0,
            mapPixelX: coords.x,
            mapPixelY: coords.y,
            color: DRIVER_COLORS[idx % DRIVER_COLORS.length],
          });
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
        if (!update || typeof update.CarID !== 'number') break;
        const guid = this.carIdToGuid.get(update.CarID);
        if (!guid) break;
        const driver = this.driversByGuid.get(guid);
        if (!driver) break;

        if (update.Pos) {
          const wx = Number(update.Pos.X || 0);
          const wz = Number(update.Pos.Z || 0);
          const coords = this.worldToMapPixel(wx, wz);
          driver.worldX = wx;
          driver.worldZ = wz;
          driver.mapPixelX = coords.x;
          driver.mapPixelY = coords.y;
        }

        if (update.Velocity) {
          const vx = Number(update.Velocity.X || 0);
          const vz = Number(update.Velocity.Z || 0);
          driver.speedKmh = Math.floor(Math.sqrt(vx * vx + vz * vz) * 3.6);
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
        break;
      }
    }
  }

  /**
   * Traduce coordenadas 3D (X, Z) del servidor de Assetto Corsa a píxeles exactos sobre `map.png`.
   */
  private worldToMapPixel(
    worldX: number,
    worldZ: number
  ): { x: number; y: number } {
    const { offsetX, offsetY, margin, scaleFactor, padding } =
      this.state.mapData;
    const safeScale = scaleFactor > 0 ? scaleFactor : 1;

    const x = (worldX + offsetX + margin) / safeScale + padding;
    const y = (worldZ + offsetY + margin) / safeScale + padding;

    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    };
  }

  private mapSessionType(typeNum: number | undefined, fallbackName?: string): string {
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
