import { env } from '../config/env.js';

export interface ConnectedDriver {
  name: string;
  carModel: string;
  nation?: string;
  bestLap?: string;
}

export interface ServerLiveStatus {
  online: boolean;
  serverName: string;
  trackName: string;
  trackConfig?: string;
  sessionType: 'Practice' | 'Qualy' | 'Race' | 'Booking' | 'Desconocida';
  timeLeftFormatted: string;
  connectedDriversCount: number;
  maxClients: number;
  ambientTemp?: number;
  roadTemp?: number;
  drivers: ConnectedDriver[];
  updatedAt: Date;
}

/**
 * Interfaces flexibles para soportar `/api/details` (Emperor CM Wrapper),
 * `/live-timings.json` y `/INFO` + `/JSON|`.
 */
interface RawEmperorLiveTimings {
  ServerName?: string;
  name?: string;
  Track?: string;
  track?: string;
  TrackConfig?: string;
  track_config?: string;
  SessionType?: number | string;
  session?: number | string;
  TimeLeft?: number;
  timeleft?: number;
  MaxClients?: number;
  maxclients?: number;
  Clients?: number;
  clients?: number;
  ambientTemperature?: number;
  roadTemperature?: number;
  players?: {
    Cars?: RawEmperorDriver[];
  };
  ConnectedDrivers?: Record<string, RawEmperorDriver> | RawEmperorDriver[];
  Drivers?: Record<string, RawEmperorDriver> | RawEmperorDriver[];
  Cars?: RawEmperorDriver[];
}

interface RawEmperorDriver {
  CarInfo?: {
    DriverName?: string;
    CarModel?: string;
    CarName?: string;
    IsConnected?: boolean;
  };
  DriverName?: string;
  Driver?: string;
  name?: string;
  DriverNation?: string;
  CarModel?: string;
  Model?: string;
  car?: string;
  IsConnected?: boolean;
  BestLap?: number;
}

export class EmperorService {
  private mockCycleIndex = 0;

  /**
   * Genera el enlace directo del protocolo nativo de Content Manager (acmanager://).
   */
  public getContentManagerProtocolLink(): string {
    const base = `acmanager://race/online/join?ip=${env.EMPEROR_IP_OR_DOMAIN}&httpPort=${env.joinHttpPort}`;
    if (env.AC_SERVER_PASSWORD) {
      return `${base}&password=${encodeURIComponent(env.AC_SERVER_PASSWORD)}`;
    }
    return base;
  }

  /**
   * Genera el enlace HTTPS oficial de redirección de Content Manager (compatible con botones de Discord).
   */
  public getContentManagerJoinButtonUrl(): string {
    const base = `https://acstuff.ru/s/q:race/online/join?httpPort=${env.joinHttpPort}&ip=${env.EMPEROR_IP_OR_DOMAIN}`;
    if (env.AC_SERVER_PASSWORD) {
      return `${base}&password=${encodeURIComponent(env.AC_SERVER_PASSWORD)}`;
    }
    return base;
  }

  /**
   * Consulta el estado del servidor en vivo (o devuelve datos simulados si MOCK_MODE=true).
   * Nunca lanza una excepción no controlada: si el servidor no responde, devuelve `online: false`.
   */
  public async getLiveStatus(): Promise<ServerLiveStatus> {
    if (env.MOCK_MODE) {
      return this.getMockLiveStatus();
    }

    const baseUrl = env.EMPEROR_IP_OR_DOMAIN.startsWith('http')
      ? `${env.EMPEROR_IP_OR_DOMAIN}:${env.EMPEROR_HTTP_PORT}`
      : `http://${env.EMPEROR_IP_OR_DOMAIN}:${env.EMPEROR_HTTP_PORT}`;

    const candidateEndpoints = [
      `${baseUrl}/api/details`,
      `${baseUrl}/live-timings.json`,
      `${baseUrl}/INFO`,
    ];

    for (const url of candidateEndpoints) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(7000),
        });

        if (!response.ok) {
          continue;
        }

        const rawData = (await response.json()) as RawEmperorLiveTimings;
        return this.normalizeEmperorResponse(rawData);
      } catch {
        continue;
      }
    }

    return {
      online: false,
      serverName: 'LATAM Simracing Alliance',
      trackName: 'Fuera de línea / Reiniciando',
      sessionType: 'Desconocida',
      timeLeftFormatted: '--:--',
      connectedDriversCount: 0,
      maxClients: 0,
      drivers: [],
      updatedAt: new Date(),
    };
  }

  /**
   * Normaliza la respuesta JSON de Emperor Server / ACSM (`/api/details`) al formato interno tipado.
   */
  private normalizeEmperorResponse(raw: RawEmperorLiveTimings): ServerLiveStatus {
    const rawServerName = raw.ServerName ?? raw.name ?? 'LATAM Simracing Alliance';
    // Limpiar el sufijo de puerto que agrega Content Manager Wrapper si está presente
    const serverName = rawServerName.replace(/\s*ℹ\d+$/, '').trim();

    const rawTrack = raw.Track ?? raw.track ?? 'Circuito desconocido';
    const trackConfig = raw.TrackConfig ?? raw.track_config;

    const drivers = this.extractConnectedDrivers(raw);
    const connectedDriversCount =
      drivers.length > 0 ? drivers.length : Number(raw.Clients ?? raw.clients ?? 0);
    const maxClients = Number(raw.MaxClients ?? raw.maxclients ?? 24);

    const sessionType = this.parseSessionType(raw.SessionType ?? raw.session);
    const timeLeftFormatted = this.formatTimeLeft(raw.TimeLeft ?? raw.timeleft);

    return {
      online: true,
      serverName,
      trackName: this.formatIdentifier(rawTrack),
      trackConfig: trackConfig ? this.formatIdentifier(trackConfig) : undefined,
      sessionType,
      timeLeftFormatted,
      connectedDriversCount,
      maxClients,
      ambientTemp: raw.ambientTemperature,
      roadTemp: raw.roadTemperature,
      drivers,
      updatedAt: new Date(),
    };
  }

  private extractConnectedDrivers(raw: RawEmperorLiveTimings): ConnectedDriver[] {
    const source =
      raw.players?.Cars ?? raw.ConnectedDrivers ?? raw.Drivers ?? raw.Cars;
    if (!source) return [];

    const driverEntries: RawEmperorDriver[] = Array.isArray(source)
      ? source
      : Object.values(source);

    const connected: ConnectedDriver[] = [];

    for (const entry of driverEntries) {
      const isConnected = entry.CarInfo?.IsConnected ?? entry.IsConnected ?? false;
      const driverName =
        entry.CarInfo?.DriverName ?? entry.DriverName ?? entry.Driver ?? entry.name;
      const carModel =
        entry.CarInfo?.CarName ??
        entry.CarInfo?.CarModel ??
        entry.CarModel ??
        entry.Model ??
        entry.car ??
        'Auto desconocido';

      if (!isConnected || !driverName || driverName.trim() === '') {
        continue;
      }

      connected.push({
        name: driverName.trim(),
        carModel: this.formatIdentifier(carModel),
        nation: entry.DriverNation || undefined,
        bestLap:
          entry.BestLap && entry.BestLap > 0
            ? this.formatLapTime(entry.BestLap)
            : undefined,
      });
    }

    return connected;
  }

  private parseSessionType(
    rawSession: number | string | undefined
  ): ServerLiveStatus['sessionType'] {
    if (typeof rawSession === 'string') {
      const normalized = rawSession.toLowerCase();
      if (normalized.includes('prac')) return 'Practice';
      if (normalized.includes('qual')) return 'Qualy';
      if (normalized.includes('race')) return 'Race';
      if (normalized.includes('book')) return 'Booking';
    }

    // Convención estándar de Assetto Corsa: 0=Booking, 1=Practice, 2=Qualy, 3=Race
    switch (Number(rawSession)) {
      case 0:
        return 'Booking';
      case 1:
        return 'Practice';
      case 2:
        return 'Qualy';
      case 3:
        return 'Race';
      default:
        return 'Practice';
    }
  }

  private formatTimeLeft(rawTimeLeft: number | undefined): string {
    if (!rawTimeLeft || rawTimeLeft <= 0) return 'En curso';

    const totalSeconds =
      rawTimeLeft > 86400 ? Math.floor(rawTimeLeft / 1000) : Math.floor(rawTimeLeft);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private formatLapTime(lapMs: number): string {
    const ms = lapMs > 10_000_000 ? Math.floor(lapMs / 1_000_000) : lapMs;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  private formatIdentifier(rawId: string): string {
    return rawId
      .replace(/^(ks_|rt_|lmgt3_|fsr_|ac_friends_|bm_|ng_)/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\bGt3\b/g, 'GT3')
      .replace(/\bAmg\b/g, 'AMG')
      .replace(/\bBmw\b/g, 'BMW')
      .replace(/\bLms\b/g, 'LMS')
      .replace(/\bNsx\b/g, 'NSX')
      .replace(/\bGtr\b/g, 'GTR')
      .replace(/\bRcf\b/g, 'RCF')
      .replace(/\bGr\b/g, 'GR')
      .replace(/\bEvo\b/g, 'Evo');
  }

  private getMockLiveStatus(): ServerLiveStatus {
    const scenarios: Array<Omit<ServerLiveStatus, 'updatedAt'>> = [
      {
        online: true,
        serverName: 'LATAM Simracing Alliance - Bathurst [MOCK]',
        trackName: 'Bathurst',
        sessionType: 'Practice',
        timeLeftFormatted: '42:15',
        connectedDriversCount: 1,
        maxClients: 16,
        ambientTemp: 20,
        roadTemp: 44,
        drivers: [
          {
            name: 'Javier Weimann',
            carModel: 'Lamborghini Huracan GT3 Evo2',
            nation: 'ARG',
            bestLap: '2:04.412',
          },
        ],
      },
      {
        online: true,
        serverName: 'LATAM Simracing Alliance - Bathurst [MOCK]',
        trackName: 'Bathurst',
        sessionType: 'Qualy',
        timeLeftFormatted: '18:40',
        connectedDriversCount: 3,
        maxClients: 16,
        ambientTemp: 20,
        roadTemp: 44,
        drivers: [
          {
            name: 'Javier Weimann',
            carModel: 'Lamborghini Huracan GT3 Evo2',
            nation: 'ARG',
            bestLap: '2:03.890',
          },
          {
            name: 'Alonso Cabezas',
            carModel: 'Porsche 992 GT3 R',
            nation: 'CHL',
            bestLap: '2:04.105',
          },
          {
            name: 'JotaEme Fernández',
            carModel: 'Mercedes AMG GT3 Evo',
            nation: 'CHL',
            bestLap: '2:04.550',
          },
        ],
      },
      {
        online: true,
        serverName: 'LATAM Simracing Alliance - Bathurst [MOCK]',
        trackName: 'Bathurst',
        sessionType: 'Practice',
        timeLeftFormatted: '59:00',
        connectedDriversCount: 0,
        maxClients: 16,
        ambientTemp: 20,
        roadTemp: 44,
        drivers: [],
      },
    ];

    const currentScenario = scenarios[this.mockCycleIndex % scenarios.length];
    this.mockCycleIndex++;

    return {
      ...currentScenario,
      updatedAt: new Date(),
    };
  }
}

export const emperorService = new EmperorService();
