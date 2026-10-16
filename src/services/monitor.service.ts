import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Client,
  type TextChannel,
} from 'discord.js';
import { env } from '../config/env.js';
import {
  emperorService,
  type ServerLiveStatus,
} from './emperor.service.js';
import { buildServerStatusMessagePayload } from '../utils/embed.util.js';

interface PersistedBotState {
  statusMessageId?: string;
}

const STATE_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE_PATH = path.join(STATE_DIR, 'bot-state.json');

const SMART_PING_MIN_DRIVERS = 3;
const SMART_PING_COOLDOWN_MS = 60 * 60 * 1000; // 60 minutos

export class MonitorService {
  private client: Client;
  private pollingTimer: NodeJS.Timeout | null = null;
  private statusMessageId: string | null = null;
  private previousDriversCount = 0;
  private lastAlertTimestamp = 0;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Inicia el monitor periódico (polling loop).
   */
  public async start(): Promise<void> {
    await this.loadPersistedState();

    console.log(
      `📡 Monitor iniciado (Intervalo: ${env.POLLING_INTERVAL_SECONDS}s | MOCK_MODE: ${env.MOCK_MODE})`
    );

    // Primera ejecución inmediata
    await this.tick();

    // Loop periódico
    this.pollingTimer = setInterval(() => {
      void this.tick();
    }, env.POLLING_INTERVAL_SECONDS * 1000);
  }

  public stop(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Ejecuta un ciclo completo de monitoreo:
   * 1. Consulta Emperor Server.
   * 2. Edita o crea el mensaje persistente en STATUS_CHANNEL_ID.
   * 3. Actualiza el Rich Presence del bot.
   * 4. Evalúa y dispara el Smart Ping si se supera el umbral con cooldown activo.
   */
  private async tick(): Promise<void> {
    try {
      const status = await emperorService.getLiveStatus();

      await Promise.allSettled([
        this.updatePersistentStatusMessage(status),
        this.updateBotPresence(status),
        this.evaluateSmartPing(status),
      ]);

      this.previousDriversCount = status.online ? status.connectedDriversCount : 0;
    } catch (error) {
      console.error('⚠️ Error inesperado en ciclo de monitoreo:', error);
    }
  }

  /**
   * Edita el mensaje existente en el canal de estado o crea uno nuevo y guarda su ID.
   */
  private async updatePersistentStatusMessage(
    status: ServerLiveStatus
  ): Promise<void> {
    const channel = await this.client.channels
      .fetch(env.STATUS_CHANNEL_ID)
      .catch(() => null);

    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      console.warn(
        `⚠️ No se pudo acceder al canal de estado (${env.STATUS_CHANNEL_ID}). Verifica permisos e ID.`
      );
      return;
    }

    const textChannel = channel as TextChannel;
    const payload = buildServerStatusMessagePayload(status);

    if (this.statusMessageId) {
      try {
        const existingMessage = await textChannel.messages.fetch(
          this.statusMessageId
        );
        await existingMessage.edit(payload);
        return;
      } catch {
        console.log(
          'ℹ️ El mensaje de estado anterior no existe o fue eliminado; creando uno nuevo...'
        );
        this.statusMessageId = null;
      }
    }

    try {
      const newMessage = await textChannel.send(payload);
      this.statusMessageId = newMessage.id;
      await this.savePersistedState({ statusMessageId: newMessage.id });
    } catch (error) {
      console.error('❌ Error al publicar el mensaje de estado en Discord:', error);
    }
  }

  /**
   * Actualiza la presencia (Rich Presence) del bot: "Actividad: X/Y en [Circuito]"
   */
  private async updateBotPresence(status: ServerLiveStatus): Promise<void> {
    if (!this.client.user) return;

    if (!status.online) {
      this.client.user.setPresence({
        status: 'dnd',
        activities: [
          {
            name: 'Servidor Offline / Reiniciando',
            type: ActivityType.Watching,
          },
        ],
      });
      return;
    }

    const activityText = `Actividad: ${status.connectedDriversCount}/${status.maxClients} en ${status.trackName}`;
    this.client.user.setPresence({
      status: status.connectedDriversCount > 0 ? 'online' : 'idle',
      activities: [
        {
          name: activityText,
          type: ActivityType.Watching,
        },
      ],
    });
  }

  /**
   * Sistema de Alerta Inteligente (Smart Ping):
   * Dispara cuando los pilotos suben de <3 a >=3 y respeta el cooldown de 60 minutos en memoria.
   */
  private async evaluateSmartPing(status: ServerLiveStatus): Promise<void> {
    if (!status.online) return;

    const crossedThreshold =
      this.previousDriversCount < SMART_PING_MIN_DRIVERS &&
      status.connectedDriversCount >= SMART_PING_MIN_DRIVERS;

    if (!crossedThreshold) return;

    const now = Date.now();
    const elapsedSinceLastAlert = now - this.lastAlertTimestamp;

    if (
      this.lastAlertTimestamp > 0 &&
      elapsedSinceLastAlert < SMART_PING_COOLDOWN_MS
    ) {
      const remainingMinutes = Math.ceil(
        (SMART_PING_COOLDOWN_MS - elapsedSinceLastAlert) / 60000
      );
      console.log(
        `⏳ Smart Ping omitido por cooldown (${remainingMinutes} min restantes).`
      );
      return;
    }

    const alertChannel = await this.client.channels
      .fetch(env.ALERT_CHANNEL_ID)
      .catch(() => null);

    if (!alertChannel || !alertChannel.isTextBased() || !('send' in alertChannel)) {
      console.warn(
        `⚠️ No se pudo acceder al canal de alertas (${env.ALERT_CHANNEL_ID}).`
      );
      return;
    }

    const directProtocolLink = emperorService.getContentManagerProtocolLink();
    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();
    const driversNames = status.drivers.map((d) => `**${d.name}** (${d.carModel})`).join(', ');

    const alertEmbed = new EmbedBuilder()
      .setTitle('🔥 ¡Se armó acción en pista!')
      .setDescription(
        `Ya hay **${status.connectedDriversCount}/${status.maxClients}** pilotos girando en **${status.trackName}** (${status.sessionType}).\n\n` +
          `👥 **En pista:** ${driversNames || 'Varios pilotos'}\n` +
          `🔗 **Link directo CM:** \`${directProtocolLink}\``
      )
      .setColor(0x2ecc71)
      .setTimestamp(new Date());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Sumarse a Pista (1-Click CM)')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🚀')
    );

    try {
      await (alertChannel as TextChannel).send({
        content: `🔔 <@&${env.ALERT_ROLE_ID}> ¡Hay gente girando en el servidor!`,
        embeds: [alertEmbed],
        components: [row],
        allowedMentions: {
          roles: [env.ALERT_ROLE_ID],
        },
      });

      this.lastAlertTimestamp = now;
      console.log(
        `🚨 Smart Ping enviado en el canal de alertas (${status.connectedDriversCount} pilotos).`
      );
    } catch (error) {
      console.error('❌ Error al enviar el Smart Ping:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const raw = await readFile(STATE_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw) as PersistedBotState;
      if (data.statusMessageId) {
        this.statusMessageId = data.statusMessageId;
      }
    } catch {
      // Archivo aún no existe, se creará automáticamente al enviar el primer mensaje
    }
  }

  private async savePersistedState(state: PersistedBotState): Promise<void> {
    try {
      await mkdir(STATE_DIR, { recursive: true });
      await writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('⚠️ No se pudo guardar el estado local del bot:', error);
    }
  }
}
