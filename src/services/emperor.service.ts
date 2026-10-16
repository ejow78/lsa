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

export interface SessionStandingEntry {
  position: number;
  driverName: string;
  carModel: string;
  bestLapMs: number;
  bestLapFormatted: string;
  gapFormatted: string;
  numLaps: number;
  incidentsCount: number;
}

export interface SessionResultSummary {
  fileName: string;
  webUrl: string;
  trackName: string;
  trackPreviewUrl: string;
  sessionType: string;
  dateFormatted: string;
  standings: SessionStandingEntry[];
  fastestLap?: {
    driverName: string;
    carModel: string;
    lapFormatted: string;
  };
  totalLaps: number;
  totalIncidents: number;
}

export interface HotlapEntry {
  rank: number;
  driverName: string;
  carModel: string;
  bestLapMs: number;
  bestLapFormatted: string;
  gapFormatted: string;
  tyre?: string;
  lapsCount: number;
}

export interface TrackHotlapsSummary {
  trackName: string;
  trackPreviewUrl: string;
  entries: HotlapEntry[];
  sessionsAnalyzed: number;
}

export interface DriverCarStat {
  carModel: string;
  bestLapMs: number;
  bestLapFormatted: string;
  lapsCount: number;
  cleanLapsCount: number;
}

export interface DriverProfileSummary {
  found: boolean;
  driverName: string;
  trackName: string;
  trackPreviewUrl: string;
  bestLapFormatted: string;
  bestLapCar: string;
  optimalLapFormatted?: string;
  bestSectorsFormatted?: [string, string, string];
  totalLaps: number;
  cleanLaps: number;
  totalIncidents: number;
  carsUsed: DriverCarStat[];
  availableDrivers: string[];
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

interface RawResultJson {
  TrackName?: string;
  TrackConfig?: string;
  Type?: string;
  Date?: string;
  Result?: Array<{
    DriverName?: string;
    DriverGuid?: string;
    CarModel?: string;
    BestLap?: number;
    TotalTime?: number;
    NumLaps?: number;
  }>;
  Laps?: Array<{
    DriverName?: string;
    DriverGuid?: string;
    CarModel?: string;
    LapTime?: number;
    Sectors?: number[];
    Cuts?: number;
    Tyre?: string;
  }>;
  Events?: Array<{
    Type?: string;
    ImpactSpeed?: number;
    Driver?: {
      Name?: string;
      Guid?: string;
    };
  }>;
}

export class EmperorService {
  private mockCycleIndex = 0;

  public getContentManagerProtocolLink(): string {
    return `acmanager://race/online/join?ip=${env.EMPEROR_IP_OR_DOMAIN}&httpPort=${env.joinHttpPort}`;
  }

  public getContentManagerJoinButtonUrl(): string {
    return `https://acstuff.ru/s/q:race/online/join?httpPort=${env.joinHttpPort}&ip=${env.EMPEROR_IP_OR_DOMAIN}`;
  }

  public getLiveTimingWebUrl(): string {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    return `${base}/live-timing`;
  }

  public getChampionshipsWebUrl(): string {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    return `${base}/championships`;
  }

  public getResultsWebUrl(): string {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    return `${base}/results`;
  }

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

  /**
   * Obtiene la lista de archivos JSON de resultados recientes en Emperor Server (`/results`).
   */
  public async getRecentResultFileNames(limit = 10): Promise<string[]> {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    try {
      const resp = await fetch(`${base}/results`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return [];

      const html = await resp.text();
      const matches = [
        ...html.matchAll(/href="\/results\/download\/([^"]+\.json)"/gi),
      ];
      const uniqueFiles = [...new Set(matches.map((m) => m[1]))];
      return uniqueFiles.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Obtiene el resumen completo de la última sesión con actividad registrada en `/results`.
   */
  public async getLatestSessionResult(): Promise<SessionResultSummary | null> {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    const files = await this.getRecentResultFileNames(8);

    for (const fileName of files) {
      try {
        const resp = await fetch(`${base}/results/download/${fileName}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (!resp.ok) continue;

        const data = (await resp.json()) as RawResultJson;
        const activeResults = (data.Result ?? []).filter(
          (r) => (r.NumLaps ?? 0) > 0 && r.DriverName && r.DriverName.trim() !== ''
        );

        if (activeResults.length === 0) continue;

        // Contar incidentes por piloto
        const incidentsByDriver = new Map<string, number>();
        for (const ev of data.Events ?? []) {
          const dName = ev.Driver?.Name?.trim();
          if (dName) {
            incidentsByDriver.set(dName, (incidentsByDriver.get(dName) ?? 0) + 1);
          }
        }

        // Ordenar: para prácticas/qualy por mejor vuelta, para carrera por orden de Result
        const isRace = (data.Type ?? '').toUpperCase().includes('RACE');
        const sorted = [...activeResults].sort((a, b) => {
          if (isRace) return 0;
          const lapA = a.BestLap && a.BestLap > 0 ? a.BestLap : 999_999_999;
          const lapB = b.BestLap && b.BestLap > 0 ? b.BestLap : 999_999_999;
          return lapA - lapB;
        });

        const validBestLaps = sorted
          .map((r) => r.BestLap ?? 0)
          .filter((ms) => ms > 0 && ms < 900_000_000);
        const fastestLapMs =
          validBestLaps.length > 0 ? Math.min(...validBestLaps) : 0;

        let fastestLapInfo: SessionResultSummary['fastestLap'];

        const standings: SessionStandingEntry[] = sorted.map((r, idx) => {
          const driverName = r.DriverName!.trim();
          const carModel = this.formatIdentifier(r.CarModel ?? 'Auto');
          const bestLapMs =
            r.BestLap && r.BestLap > 0 && r.BestLap < 900_000_000
              ? r.BestLap
              : 0;
          const bestLapFormatted =
            bestLapMs > 0 ? this.formatLapTime(bestLapMs) : 'Sin tiempo';

          let gapFormatted = '';
          if (bestLapMs > 0 && fastestLapMs > 0) {
            if (bestLapMs === fastestLapMs) {
              gapFormatted = '💜 VR';
              if (!fastestLapInfo) {
                fastestLapInfo = {
                  driverName,
                  carModel,
                  lapFormatted: bestLapFormatted,
                };
              }
            } else {
              const diffSec = ((bestLapMs - fastestLapMs) / 1000).toFixed(3);
              gapFormatted = `+${diffSec}s`;
            }
          }

          return {
            position: idx + 1,
            driverName,
            carModel,
            bestLapMs,
            bestLapFormatted,
            gapFormatted,
            numLaps: r.NumLaps ?? 0,
            incidentsCount: incidentsByDriver.get(driverName) ?? 0,
          };
        });

        const rawTrack = data.TrackName ?? 'rt_bathurst';
        const rawConfig = data.TrackConfig;
        const pageSlug = fileName.replace(/\.json$/i, '');

        return {
          fileName,
          webUrl: `${base}/results/${pageSlug}`,
          trackName: this.formatIdentifier(rawTrack),
          trackPreviewUrl: this.getTrackPreviewImageUrl(rawTrack, rawConfig),
          sessionType: this.parseSessionType(data.Type),
          dateFormatted: data.Date
            ? new Date(data.Date).toLocaleString('es-AR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : pageSlug,
          standings,
          fastestLap: fastestLapInfo,
          totalLaps: standings.reduce((acc, s) => acc + s.numLaps, 0),
          totalIncidents: (data.Events ?? []).length,
        };
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Construye el Leaderboard de mejores tiempos (Hotlaps) analizando las sesiones recientes.
   * @param byCar Si es true, muestra el mejor tiempo de cada combinación Piloto + Auto. Si es false, solo el mejor tiempo absoluto de cada Piloto.
   */
  public async getTrackHotlaps(byCar = false): Promise<TrackHotlapsSummary | null> {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    const files = await this.getRecentResultFileNames(12);
    if (files.length === 0) return null;

    const recordsMap = new Map<
      string,
      {
        driverName: string;
        carModel: string;
        bestLapMs: number;
        tyre?: string;
        lapsCount: number;
      }
    >();

    let targetTrackRaw = '';
    let targetConfigRaw: string | undefined;
    let sessionsAnalyzed = 0;

    for (const fileName of files) {
      try {
        const resp = await fetch(`${base}/results/download/${fileName}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (!resp.ok) continue;

        const data = (await resp.json()) as RawResultJson;
        if (!data.TrackName) continue;

        if (!targetTrackRaw) {
          targetTrackRaw = data.TrackName;
          targetConfigRaw = data.TrackConfig;
        } else if (data.TrackName !== targetTrackRaw) {
          // Solo comparamos tiempos del mismo circuito activo
          continue;
        }

        sessionsAnalyzed++;

        // Analizar vuelta por vuelta (priorizando vueltas limpias Cuts === 0)
        for (const lap of data.Laps ?? []) {
          const driverName = lap.DriverName?.trim();
          const lapMs = lap.LapTime ?? 0;
          if (!driverName || lapMs <= 0 || lapMs > 900_000_000) continue;

          const carModel = this.formatIdentifier(lap.CarModel ?? 'Auto');
          const key = byCar ? `${driverName}:::${carModel}` : driverName;

          const existing = recordsMap.get(key);
          const isClean = (lap.Cuts ?? 0) === 0;

          if (!existing) {
            recordsMap.set(key, {
              driverName,
              carModel,
              bestLapMs: isClean ? lapMs : 999_999_999,
              tyre: lap.Tyre,
              lapsCount: 1,
            });
          } else {
            existing.lapsCount++;
            if (isClean && lapMs < existing.bestLapMs) {
              existing.bestLapMs = lapMs;
              existing.carModel = carModel;
              existing.tyre = lap.Tyre;
            }
          }
        }

        // Respaldo con Result por si alguna sesión no detalló Laps
        for (const res of data.Result ?? []) {
          const driverName = res.DriverName?.trim();
          const bestMs = res.BestLap ?? 0;
          if (!driverName || bestMs <= 0 || bestMs > 900_000_000) continue;

          const carModel = this.formatIdentifier(res.CarModel ?? 'Auto');
          const key = byCar ? `${driverName}:::${carModel}` : driverName;
          const existing = recordsMap.get(key);

          if (!existing) {
            recordsMap.set(key, {
              driverName,
              carModel,
              bestLapMs: bestMs,
              lapsCount: res.NumLaps ?? 1,
            });
          } else if (bestMs < existing.bestLapMs) {
            existing.bestLapMs = bestMs;
            existing.carModel = carModel;
          }
        }
      } catch {
        continue;
      }
    }

    const validRecords = [...recordsMap.values()]
      .filter((r) => r.bestLapMs > 0 && r.bestLapMs < 900_000_000)
      .sort((a, b) => a.bestLapMs - b.bestLapMs);

    const fastestMs = validRecords[0]?.bestLapMs ?? 0;

    const entries: HotlapEntry[] = validRecords.map((rec, idx) => {
      const diffSec =
        idx === 0
          ? '👑 Récord'
          : `+${((rec.bestLapMs - fastestMs) / 1000).toFixed(3)}s`;

      return {
        rank: idx + 1,
        driverName: rec.driverName,
        carModel: rec.carModel,
        bestLapMs: rec.bestLapMs,
        bestLapFormatted: this.formatLapTime(rec.bestLapMs),
        gapFormatted: diffSec,
        tyre: rec.tyre,
        lapsCount: rec.lapsCount,
      };
    });

    const rawTrack = targetTrackRaw || 'rt_bathurst';
    return {
      trackName: this.formatIdentifier(rawTrack),
      trackPreviewUrl: this.getTrackPreviewImageUrl(rawTrack, targetConfigRaw),
      entries,
      sessionsAnalyzed,
    };
  }

  /**
   * Construye la ficha de telemetría detallada de un piloto (vueltas, autos probados, vuelta óptima e incidentes).
   */
  public async getDriverProfile(
    queryName?: string
  ): Promise<DriverProfileSummary | null> {
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
    const files = await this.getRecentResultFileNames(12);
    if (files.length === 0) return null;

    const allDriversSet = new Set<string>();
    const parsedSessions: RawResultJson[] = [];
    let targetTrackRaw = '';
    let targetConfigRaw: string | undefined;

    for (const fileName of files) {
      try {
        const resp = await fetch(`${base}/results/download/${fileName}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (!resp.ok) continue;

        const data = (await resp.json()) as RawResultJson;
        if (!data.TrackName) continue;

        if (!targetTrackRaw) {
          targetTrackRaw = data.TrackName;
          targetConfigRaw = data.TrackConfig;
        } else if (data.TrackName !== targetTrackRaw) {
          continue;
        }

        parsedSessions.push(data);

        for (const lap of data.Laps ?? []) {
          if (lap.DriverName?.trim()) {
            allDriversSet.add(lap.DriverName.trim());
          }
        }
        for (const res of data.Result ?? []) {
          if ((res.NumLaps ?? 0) > 0 && res.DriverName?.trim()) {
            allDriversSet.add(res.DriverName.trim());
          }
        }
      } catch {
        continue;
      }
    }

    const availableDrivers = [...allDriversSet];
    const rawTrack = targetTrackRaw || 'rt_bathurst';
    const trackName = this.formatIdentifier(rawTrack);
    const trackPreviewUrl = this.getTrackPreviewImageUrl(
      rawTrack,
      targetConfigRaw
    );

    if (availableDrivers.length === 0) {
      return null;
    }

    // Buscar coincidencia parcial (insensible a mayúsculas/acentos) o elegir el primero si no se pasó nombre
    const normalizeStr = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const matchedDriver = queryName
      ? availableDrivers.find((d) =>
          normalizeStr(d).includes(normalizeStr(queryName))
        )
      : availableDrivers[0];

    if (!matchedDriver) {
      return {
        found: false,
        driverName: queryName ?? '',
        trackName,
        trackPreviewUrl,
        bestLapFormatted: '--:--',
        bestLapCar: '-',
        totalLaps: 0,
        cleanLaps: 0,
        totalIncidents: 0,
        carsUsed: [],
        availableDrivers,
      };
    }

    let totalLaps = 0;
    let cleanLaps = 0;
    let totalIncidents = 0;
    let bestLapMs = 999_999_999;
    let bestLapCar = '-';
    const bestSectors: [number, number, number] = [
      999_999_999,
      999_999_999,
      999_999_999,
    ];

    const carsMap = new Map<
      string,
      { bestLapMs: number; lapsCount: number; cleanLapsCount: number }
    >();

    for (const session of parsedSessions) {
      for (const ev of session.Events ?? []) {
        if (ev.Driver?.Name?.trim() === matchedDriver) {
          totalIncidents++;
        }
      }

      for (const lap of session.Laps ?? []) {
        if (lap.DriverName?.trim() !== matchedDriver) continue;

        const lapMs = lap.LapTime ?? 0;
        const isClean = (lap.Cuts ?? 0) === 0;
        const carModel = this.formatIdentifier(lap.CarModel ?? 'Auto');

        totalLaps++;
        if (isClean) cleanLaps++;

        const carStat = carsMap.get(carModel) ?? {
          bestLapMs: 999_999_999,
          lapsCount: 0,
          cleanLapsCount: 0,
        };
        carStat.lapsCount++;
        if (isClean) {
          carStat.cleanLapsCount++;
          if (lapMs > 0 && lapMs < carStat.bestLapMs) {
            carStat.bestLapMs = lapMs;
          }
          if (lapMs > 0 && lapMs < bestLapMs) {
            bestLapMs = lapMs;
            bestLapCar = carModel;
          }
          if (lap.Sectors && lap.Sectors.length === 3) {
            if (lap.Sectors[0] > 0 && lap.Sectors[0] < bestSectors[0]) {
              bestSectors[0] = lap.Sectors[0];
            }
            if (lap.Sectors[1] > 0 && lap.Sectors[1] < bestSectors[1]) {
              bestSectors[1] = lap.Sectors[1];
            }
            if (lap.Sectors[2] > 0 && lap.Sectors[2] < bestSectors[2]) {
              bestSectors[2] = lap.Sectors[2];
            }
          }
        }
        carsMap.set(carModel, carStat);
      }
    }

    const hasValidSectors = bestSectors.every((s) => s < 900_000_000);
    const optimalLapMs = hasValidSectors
      ? bestSectors[0] + bestSectors[1] + bestSectors[2]
      : 0;

    const carsUsed: DriverCarStat[] = [...carsMap.entries()]
      .map(([carModel, stat]) => ({
        carModel,
        bestLapMs: stat.bestLapMs,
        bestLapFormatted:
          stat.bestLapMs < 900_000_000
            ? this.formatLapTime(stat.bestLapMs)
            : 'Sin vuelta limpia',
        lapsCount: stat.lapsCount,
        cleanLapsCount: stat.cleanLapsCount,
      }))
      .sort((a, b) => a.bestLapMs - b.bestLapMs);

    return {
      found: true,
      driverName: matchedDriver,
      trackName,
      trackPreviewUrl,
      bestLapFormatted:
        bestLapMs < 900_000_000 ? this.formatLapTime(bestLapMs) : 'Sin tiempo',
      bestLapCar,
      optimalLapFormatted:
        optimalLapMs > 0 ? this.formatLapTime(optimalLapMs) : undefined,
      bestSectorsFormatted: hasValidSectors
        ? [
            (bestSectors[0] / 1000).toFixed(3) + 's',
            (bestSectors[1] / 1000).toFixed(3) + 's',
            (bestSectors[2] / 1000).toFixed(3) + 's',
          ]
        : undefined,
      totalLaps,
      cleanLaps,
      totalIncidents,
      carsUsed,
      availableDrivers,
    };
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

  public formatLapTime(lapMs: number): string {
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
            bestLap: '2:03.321',
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
            bestLap: '2:03.321',
          },
          {
            name: 'Alonso Cabezas',
            carModel: 'Porsche 992 GT3 R',
            nation: 'CHL',
            bestLap: '2:04.823',
          },
          {
            name: 'JotaEme Fernández',
            carModel: 'Mercedes AMG GT3 Evo',
            nation: 'CHL',
            bestLap: '2:05.110',
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
