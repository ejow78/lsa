import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EmbedBuilder, type Client, type TextChannel } from 'discord.js';
import { env } from '../config/env.js';
import { emperorService } from './emperor.service.js';

export type SimulatorCategory = 'ac' | 'acc';

export interface CustomTableRow {
  position: number;
  driverName: string;
  nation: string;
  team: string;
  carModel: string;
  wins: number;
  podiums: number;
  points: number;
}

export interface CustomTable {
  id: string;
  sim: SimulatorCategory;
  title: string;
  subtitle: string;
  rows: CustomTableRow[];
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TABLES_FILE = path.join(DATA_DIR, 'tables.json');

const DEFAULT_TABLES: CustomTable[] = [
  {
    id: 'ac-gt3-2026',
    sim: 'ac',
    title: 'Campeonato GT3 — Assetto Corsa',
    subtitle: 'Temporada 2026 • LATAM SimRacing Alliance',
    updatedAt: new Date().toISOString(),
    rows: [
      {
        position: 1,
        driverName: 'Javier Weimann',
        nation: 'ARG',
        team: 'LSA Motorsport',
        carModel: 'Lamborghini Huracan GT3 Evo2',
        wins: 1,
        podiums: 1,
        points: 25,
      },
      {
        position: 2,
        driverName: 'Alonso Cabezas',
        nation: 'CHL',
        team: 'Chile Racing',
        carModel: 'Porsche 992 GT3 R',
        wins: 0,
        podiums: 1,
        points: 18,
      },
      {
        position: 3,
        driverName: 'JotaEme Fernández',
        nation: 'CHL',
        team: 'Andes SimRacing',
        carModel: 'Mercedes AMG GT3 Evo',
        wins: 0,
        podiums: 1,
        points: 15,
      },
      {
        position: 4,
        driverName: 'El Tio Jota',
        nation: 'CHL',
        team: 'Pacific GT',
        carModel: 'Mercedes AMG GT3 Evo',
        wins: 0,
        podiums: 0,
        points: 12,
      },
    ],
  },
  {
    id: 'acc-gtwc-2026',
    sim: 'acc',
    title: 'GT World Challenge LATAM — Assetto Corsa Competizione',
    subtitle: 'Sprint & Endurance Series 2026',
    updatedAt: new Date().toISOString(),
    rows: [
      {
        position: 1,
        driverName: 'Javier Weimann',
        nation: 'ARG',
        team: 'LSA Oficial',
        carModel: 'Ferrari 296 GT3',
        wins: 2,
        podiums: 3,
        points: 68,
      },
      {
        position: 2,
        driverName: 'Alonso Cabezas',
        nation: 'CHL',
        team: 'Chile Racing',
        carModel: 'Porsche 992 GT3 R',
        wins: 1,
        podiums: 3,
        points: 61,
      },
      {
        position: 3,
        driverName: 'JotaEme Fernández',
        nation: 'CHL',
        team: 'Andes SimRacing',
        carModel: 'BMW M4 GT3',
        wins: 0,
        podiums: 2,
        points: 44,
      },
    ],
  },
];

export class TablesService {
  private tables: CustomTable[] = [];
  private loaded = false;

  public async getAllTables(): Promise<CustomTable[]> {
    if (!this.loaded) {
      await this.load();
    }
    return this.tables;
  }

  public async getTablesBySim(sim: SimulatorCategory): Promise<CustomTable[]> {
    const all = await this.getAllTables();
    return all.filter((t) => t.sim === sim);
  }

  public async getTableById(id: string): Promise<CustomTable | undefined> {
    const all = await this.getAllTables();
    return all.find((t) => t.id === id);
  }

  public async saveTable(input: CustomTable): Promise<CustomTable> {
    await this.getAllTables();

    // Ordenar filas automáticamente por puntos descendente y reasignar posiciones
    const sortedRows = [...(input.rows ?? [])]
      .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
      .map((row, idx) => ({
        position: idx + 1,
        driverName: String(row.driverName || '').trim(),
        nation: String(row.nation || '').trim().toUpperCase(),
        team: String(row.team || '').trim(),
        carModel: String(row.carModel || '').trim(),
        wins: Number(row.wins || 0),
        podiums: Number(row.podiums || 0),
        points: Number(row.points || 0),
      }));

    const normalized: CustomTable = {
      id:
        input.id?.trim() ||
        `${input.sim}-${Date.now().toString(36)}`,
      sim: input.sim === 'acc' ? 'acc' : 'ac',
      title: input.title.trim() || 'Tabla de Posiciones',
      subtitle: input.subtitle?.trim() || '',
      rows: sortedRows,
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = this.tables.findIndex((t) => t.id === normalized.id);
    if (existingIdx >= 0) {
      this.tables[existingIdx] = normalized;
    } else {
      this.tables.push(normalized);
    }

    await this.persist();
    return normalized;
  }

  public async deleteTable(id: string): Promise<boolean> {
    await this.getAllTables();
    const before = this.tables.length;
    this.tables = this.tables.filter((t) => t.id !== id);
    if (this.tables.length !== before) {
      await this.persist();
      return true;
    }
    return false;
  }

  public buildTableEmbed(table: CustomTable): EmbedBuilder {
    const simBadge =
      table.sim === 'acc'
        ? 'Assetto Corsa Competizione'
        : 'Assetto Corsa';

    const lines = table.rows.slice(0, 20).map((row) => {
      const posStr = `\`${String(row.position).padStart(2, '0')}.\``;
      const flag = emperorService.formatNationFlag(row.nation);
      const flagStr = flag ? ` ${flag}` : '';
      const teamStr = row.team ? ` (${row.team})` : '';
      const winsWord = row.wins === 1 ? 'victoria' : 'victorias';
      const podiumsWord = row.podiums === 1 ? 'podio' : 'podios';

      return (
        `${posStr}${flagStr} **${row.driverName}**${teamStr} — **${row.points} puntos**\n` +
        `└ *${row.carModel}* • ${row.wins} ${winsWord} • ${row.podiums} ${podiumsWord}`
      );
    });

    return new EmbedBuilder()
      .setTitle(table.title)
      .setDescription(
        `**Simulador:** ${simBadge}` +
          (table.subtitle ? `\n**Torneo:** ${table.subtitle}` : '')
      )
      .setColor(table.sim === 'acc' ? 0xe74c3c : 0x3498db)
      .addFields({
        name: `Tabla de Posiciones (${table.rows.length} pilotos)`,
        value:
          lines.length > 0
            ? lines.join('\n').slice(0, 1024)
            : '*Sin pilotos cargados en esta tabla.*',
        inline: false,
      })
      .setTimestamp(new Date(table.updatedAt))
      .setFooter({ text: 'LATAM SimRacing Alliance • Tablas Oficiales' });
  }

  public async publishTableToDiscord(
    _client: Client | null,
    tableId: string,
    targetChannelId?: string
  ): Promise<boolean> {
    const table = await this.getTableById(tableId);
    if (!table) return false;

    const channelId = targetChannelId || env.ALERT_CHANNEL_ID;
    const embed = this.buildTableEmbed(table);

    try {
      const { REST, Routes } = await import('discord.js');
      const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
      await rest.post(Routes.channelMessages(channelId), {
        body: {
          embeds: [embed.toJSON()],
        },
      });
      return true;
    } catch (error) {
      console.error('Error publicando tabla en Discord:', error);
      return false;
    }
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(TABLES_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as CustomTable[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.tables = parsed;
        this.loaded = true;
        return;
      }
    } catch {
      // Inicializar con tablas por defecto
    }

    this.tables = DEFAULT_TABLES;
    this.loaded = true;
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(
        TABLES_FILE,
        JSON.stringify(this.tables, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error guardando data/tables.json:', error);
    }
  }
}

export const tablesService = new TablesService();
