import { env } from '../config/env.js';

export interface ConnectedDriver {
  name: string;
  carModel: string;
  nation?: string;
  bestLap?: string;
}

export interface EntryListSlot {
  slotNumber: number;
  driverName: string;
  driverTeam: string;
  driverNation: string;
  carModel: string;
  skin: string;
  isConnected: boolean;
  isFreeSlot: boolean;
}

export interface ServerEntryList {
  online: boolean;
  serverName: string;
  trackName: string;
  trackPreviewUrl?: string;
  totalSlots: number;
  assignedSlots: EntryListSlot[];
  freeSlots: EntryListSlot[];
  updatedAt: Date;
}

export interface ChampionshipEventSummary {
  index: number;
  name: string;
  trackName: string;
  trackLayout?: string;
  completed: boolean;
  scheduledDate?: string;
}

export interface ChampionshipClassSummary {
  name: string;
  totalSlots: number;
  registeredDrivers: Array<{
    name: string;
    team?: string;
    carModel: string;
  }>;
  pointsTopPlaces: number[];
  bestLapPoints: number;
  polePoints: number;
}

export interface ChampionshipSummary {
  id: string;
  name: string;
  url: string;
  signUpUrl: string;
  openEntrants: boolean;
  signUpEnabled: boolean;
  numEvents: number;
  numClasses: number;
  numEntrants: number;
  progressPercent: number;
  classes: ChampionshipClassSummary[];
  events: ChampionshipEventSummary[];
}

export interface ServerLiveStatus {
  online: boolean;
  serverName: string;
  rawTrackId?: string;
  trackName: string;
  trackConfig?: string;
  trackPreviewUrl?: string;
  sessionType: 'Practice' | 'Qualy' | 'Race' | 'Booking' | 'Desconocida';
  timeLeftFormatted: string;
  connectedDriversCount: number;
  maxClients: number;
  ambientTemp?: number;
  roadTemp?: number;
  drivers: ConnectedDriver[];
  updatedAt: Date;
}

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
  DriverTeam?: string;
  DriverNation?: string;
  CarModel?: string;
  Model?: string;
  Skin?: string;
  car?: string;
  IsConnected?: boolean;
  BestLap?: number;
}

interface RawChampionshipExport {
  ID: string;
  Name: string;
  IsInactive?: boolean;
  OpenEntrants?: boolean;
  SignUpForm?: {
    Enabled?: boolean;
  };
  Stats?: {
    NumEvents?: number;
    NumClasses?: number;
    NumEntrants?: number;
    Progress?: number;
  };
  Classes?: Array<{
    Name?: string;
    Entrants?: Record<
      string,
      {
        Name?: string;
        Team?: string;
        Model?: string;
      }
    >;
    Points?: {
      Places?: number[];
      BestLap?: number;
      PolePosition?: number;
    };
  }>;
  Events?: Array<{
    ID: string;
    Name?: string;
    Scheduled?: string;
    CompletedTime?: string;
    RaceSetup?: {
      Track?: string;
      TrackLayout?: string;
    };
  }>;
}

export class EmperorService {
  private mockCycleIndex = 0;

  /**
   * Genera el enlace directo del protocolo nativo de Content Manager (acmanager://).
   */
  public getContentManagerProtocolLink(): string {
    return `acmanager://race/online/join?ip=${env.EMPEROR_IP_OR_DOMAIN}&httpPort=${env.joinHttpPort}`;
  }

  /**
   * Genera el enlace HTTPS oficial de redirección de Content Manager (compatible con botones de Discord).
   */
  public getContentManagerJoinButtonUrl(): string {
    return `https://acstuff.ru/s/q:race/online/join?httpPort=${env.joinHttpPort}&ip=${env.EMPEROR_IP_OR_DOMAIN}`;
  }

  /**
   * Genera la URL de la página web de Live Timing de Emperor Servers.
   */
  public getLiveTimingWebUrl(): string {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    return `${base}/live-timing`;
  }

  /**
   * Genera la URL de la página de Campeonatos de Emperor Servers.
   */
  public getChampionshipsWebUrl(): string {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    return `${base}/championships`;
  }

  /**
   * Genera la URL de la foto de vista previa del circuito alojada en Emperor Servers.
   */
  public getTrackPreviewImageUrl(rawTrack: string, rawConfig?: string): string {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    if (rawConfig && rawConfig.trim() !== '') {
      return `${base}/content/tracks/${rawTrack}/${rawConfig}/ui/preview.png`;
    }
    return `${base}/content/tracks/${rawTrack}/ui/preview.png`;
  }

  public async getLiveStatus(): Promise<ServerLiveStatus> {
    if (env.MOCK_MODE) {
      return this.getMockLiveStatus();
    }

    const rawData = await this.fetchRawServerData();
    if (!rawData) {
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

    return this.normalizeEmperorResponse(rawData);
  }

  /**
   * Obtiene el Entry List completo del servidor (autos asignados a pilotos y autos libres).
   */
  public async getEntryList(): Promise<ServerEntryList> {
    const rawData = await this.fetchRawServerData();
    if (!rawData) {
      return {
        online: false,
        serverName: 'LATAM Simracing Alliance',
        trackName: 'Fuera de línea / Reiniciando',
        totalSlots: 0,
        assignedSlots: [],
        freeSlots: [],
        updatedAt: new Date(),
      };
    }

    const rawServerName =
      rawData.ServerName ?? rawData.name ?? 'LATAM Simracing Alliance';
    const serverName = rawServerName.replace(/\s*ℹ\d+$/, '').trim();
    const rawTrack = rawData.Track ?? rawData.track ?? 'Circuito desconocido';
    const trackConfig = rawData.TrackConfig ?? rawData.track_config;

    const rawCars =
      rawData.players?.Cars ??
      (Array.isArray(rawData.Cars) ? rawData.Cars : []);

    const assignedSlots: EntryListSlot[] = [];
    const freeSlots: EntryListSlot[] = [];

    rawCars.forEach((car, index) => {
      const driverName = (
        car.CarInfo?.DriverName ??
        car.DriverName ??
        car.Driver ??
        car.name ??
        ''
      ).trim();
      const rawModel =
        car.CarInfo?.CarName ??
        car.CarInfo?.CarModel ??
        car.CarModel ??
        car.Model ??
        car.car ??
        'Auto desconocido';
      const isConnected = Boolean(car.CarInfo?.IsConnected ?? car.IsConnected);
      const isFreeSlot = driverName === '';

      const slot: EntryListSlot = {
        slotNumber: index + 1,
        driverName: isFreeSlot ? 'Libre' : driverName,
        driverTeam: (car.DriverTeam ?? '').trim(),
        driverNation: (car.DriverNation ?? '').trim(),
        carModel: this.formatIdentifier(rawModel),
        skin: (car.Skin ?? '').replace(/[_-]+/g, ' ').trim(),
        isConnected,
        isFreeSlot,
      };

      if (isFreeSlot) {
        freeSlots.push(slot);
      } else {
        assignedSlots.push(slot);
      }
    });

    return {
      online: true,
      serverName,
      trackName: this.formatIdentifier(rawTrack),
      trackPreviewUrl: this.getTrackPreviewImageUrl(rawTrack, trackConfig),
      totalSlots: rawCars.length || Number(rawData.maxclients ?? 16),
      assignedSlots,
      freeSlots,
      updatedAt: new Date(),
    };
  }

  /**
   * Descubre y obtiene los campeonatos activos desde Emperor Server (`/championships` y `/championship/<id>/export`).
   */
  public async getChampionships(): Promise<ChampionshipSummary[]> {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');

    try {
      const htmlResp = await fetch(`${base}/championships`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!htmlResp.ok) return [];

      const html = await htmlResp.text();
      const matches = [
        ...html.matchAll(/href="\/championship\/([a-f0-9-]{36})"/gi),
      ];
      const uniqueIds = [...new Set(matches.map((m) => m[1]))];

      const summaries: ChampionshipSummary[] = [];

      for (const id of uniqueIds.slice(0, 5)) {
        try {
          const exportResp = await fetch(`${base}/championship/${id}/export`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
          });
          if (!exportResp.ok) continue;

          const data = (await exportResp.json()) as RawChampionshipExport;
          if (data.IsInactive) continue;

          const classes: ChampionshipClassSummary[] = (data.Classes ?? []).map(
            (cls) => {
              const entrantsValues = Object.values(cls.Entrants ?? {});
              const registeredDrivers = entrantsValues
                .filter((e) => e.Name && e.Name.trim() !== '')
                .map((e) => ({
                  name: e.Name!.trim(),
                  team: e.Team?.trim() || undefined,
                  carModel: this.formatIdentifier(e.Model ?? 'Auto'),
                }));

              return {
                name: cls.Name || 'General',
                totalSlots: entrantsValues.length,
                registeredDrivers,
                pointsTopPlaces: (cls.Points?.Places ?? []).slice(0, 5),
                bestLapPoints: cls.Points?.BestLap ?? 0,
                polePoints: cls.Points?.PolePosition ?? 0,
              };
            }
          );

          const events: ChampionshipEventSummary[] = (data.Events ?? []).map(
            (ev, idx) => {
              const rawTrack = ev.RaceSetup?.Track ?? 'Circuito';
              const rawLayout = ev.RaceSetup?.TrackLayout;
              const completed = Boolean(
                ev.CompletedTime &&
                  !ev.CompletedTime.startsWith('0001-01-01')
              );
              const scheduled =
                ev.Scheduled && !ev.Scheduled.startsWith('0001-01-01')
                  ? ev.Scheduled
                  : undefined;

              return {
                index: idx + 1,
                name: ev.Name?.trim() || `Fecha ${idx + 1}`,
                trackName: this.formatIdentifier(rawTrack),
                trackLayout: rawLayout
                  ? this.formatIdentifier(rawLayout)
                  : undefined,
                completed,
                scheduledDate: scheduled,
              };
            }
          );

          summaries.push({
            id: data.ID,
            name: data.Name || 'Campeonato',
            url: `${base}/championship/${data.ID}`,
            signUpUrl: `${base}/championship/${data.ID}/sign-up`,
            openEntrants: Boolean(data.OpenEntrants),
            signUpEnabled: Boolean(data.SignUpForm?.Enabled),
            numEvents: data.Stats?.NumEvents ?? events.length,
            numClasses: data.Stats?.NumClasses ?? classes.length,
            numEntrants: data.Stats?.NumEntrants ?? 0,
            progressPercent: Math.round(data.Stats?.Progress ?? 0),
            classes,
            events,
          });
        } catch {
          continue;
        }
      }

      return summaries;
    } catch (error) {
      console.error('⚠️ Error al consultar campeonatos en Emperor:', error);
      return [];
    }
  }

  private async fetchRawServerData(): Promise<RawEmperorLiveTimings | null> {
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

        return (await response.json()) as RawEmperorLiveTimings;
      } catch {
        continue;
      }
    }

    return null;
  }

  private normalizeEmperorResponse(raw: RawEmperorLiveTimings): ServerLiveStatus {
    const rawServerName = raw.ServerName ?? raw.name ?? 'LATAM Simracing Alliance';
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
      rawTrackId: rawTrack,
      trackName: this.formatIdentifier(rawTrack),
      trackConfig: trackConfig ? this.formatIdentifier(trackConfig) : undefined,
      trackPreviewUrl: this.getTrackPreviewImageUrl(rawTrack, trackConfig),
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

  public formatIdentifier(rawId: string): string {
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
      .replace(/\bMx5\b/g, 'MX5')
      .replace(/\bEvo\b/g, 'Evo');
  }

  private getMockLiveStatus(): ServerLiveStatus {
    const scenarios: Array<Omit<ServerLiveStatus, 'updatedAt'>> = [
      {
        online: true,
        serverName: 'LATAM Simracing Alliance - Bathurst [MOCK]',
        rawTrackId: 'rt_bathurst',
        trackName: 'Bathurst',
        trackPreviewUrl: this.getTrackPreviewImageUrl('rt_bathurst'),
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
        rawTrackId: 'rt_bathurst',
        trackName: 'Bathurst',
        trackPreviewUrl: this.getTrackPreviewImageUrl('rt_bathurst'),
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
        rawTrackId: 'rt_bathurst',
        trackName: 'Bathurst',
        trackPreviewUrl: this.getTrackPreviewImageUrl('rt_bathurst'),
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
