import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ActivityType,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Client,
  type TextChannel,
} from 'discord.js';
import { env } from '../config/env.js';
import {
  emperorService,
  type ConnectedDriver,
  type ServerLiveStatus,
} from './emperor.service.js';
import { trackMapService } from './track-map.service.js';
import {
  buildServerStatusMessagePayload,
  buildSessionResultMessagePayload,
} from '../utils/embed.util.js';

interface PersistedBotState {
  statusMessageId?: string;
  lastResultFile?: string;
  connectedDrivers?: Record<string, string>;
}

const STATE_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE_PATH = path.join(STATE_DIR, 'bot-state.json');

const SMART_PING_MIN_DRIVERS = 3;
const SMART_PING_COOLDOWN_MS = 60 * 60 * 1000; // 60 minutos

export class MonitorService {
  private client: Client;
  private pollingTimer: NodeJS.Timeout | null = null;
  private statusMessageId: string | null = null;
  private lastResultFile: string | null = null;
  private previousDriversCount = 0;
  private previousConnectedDrivers = new Map<string, string>(); // driverName -> carModel
  private lastAlertTimestamp = 0;

  constructor(client: Client) {
    this.client = client;
  }

  public async start(): Promise<void> {
    await this.loadPersistedState();

    console.log(
      `📡 Monitor iniciado (Intervalo: ${env.POLLING_INTERVAL_SECONDS}s | MOCK_MODE: ${env.MOCK_MODE})`
    );

    await this.tick();

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

  private async tick(): Promise<void> {
    try {
      const status = await emperorService.getLiveStatus();

      await Promise.allSettled([
        this.updatePersistentStatusMessage(status),
        this.updateBotPresence(status),
        this.evaluateDriverJoinAlerts(status),
        this.evaluateSmartPing(status),
        this.evaluateNewSessionResult(),
      ]);

      this.previousDriversCount = status.online
        ? status.connectedDriversCount
        : 0;
    } catch (error) {
      console.error('⚠️ Error inesperado en ciclo de monitoreo:', error);
    }
  }

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

    // Limpieza automática de mensajes duplicados en el canal de estado:
    // Conserva únicamente el mensaje más reciente y elimina cualquier duplicado viejo del bot.
    try {
      const recentMessages = await textChannel.messages.fetch({ limit: 25 });
      const botMessages = Array.from(recentMessages.values())
        .filter((m) => m.author.id === this.client.user?.id)
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

      if (botMessages.length > 0) {
        // Tomamos el mensaje más reciente del bot
        this.statusMessageId = botMessages[0].id;

        // Si existen duplicados anteriores del bot, los eliminamos
        for (let i = 1; i < botMessages.length; i++) {
          await botMessages[i].delete().catch(() => null);
        }
      }
    } catch (err) {
      // Ignorar error si no se tienen permisos para ver historial
    }

    const payload = await buildServerStatusMessagePayload(status);

    if (this.statusMessageId) {
      try {
        const existingMessage = await textChannel.messages.fetch(
          this.statusMessageId
        );
        await existingMessage.edit(payload);
        await this.savePersistedState();
        return;
      } catch (err: any) {
        if (err.code === 10008) {
          console.log(
            'ℹ️ El mensaje de estado anterior fue eliminado; creando uno nuevo...'
          );
          this.statusMessageId = null;
        } else {
          console.warn(
            '⚠️ Error temporal al editar el mensaje de estado (se reintentará en el próximo ciclo):',
            err.message
          );
          return;
        }
      }
    }

    try {
      const newMessage = await textChannel.send(payload);
      this.statusMessageId = newMessage.id;
      await this.savePersistedState();
    } catch (error) {
      console.error('❌ Error al publicar el mensaje de estado en Discord:', error);
    }
  }

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
   * Detecta cuando un piloto entra al servidor (o cambia de auto) y envía un aviso en el canal de alertas
   * mostrando la bandera, el nombre del piloto y el auto que está usando.
   */
  private async evaluateDriverJoinAlerts(
    status: ServerLiveStatus
  ): Promise<void> {
    if (!status.online) {
      this.previousConnectedDrivers.clear();
      await this.savePersistedState();
      return;
    }

    const currentMap = new Map<string, ConnectedDriver>();
    for (const driver of status.drivers) {
      currentMap.set(driver.name, driver);
    }

    const newlyJoinedDrivers: ConnectedDriver[] = [];
    for (const [name, driver] of currentMap.entries()) {
      const prevCar = this.previousConnectedDrivers.get(name);
      if (!prevCar || prevCar !== driver.carModel) {
        newlyJoinedDrivers.push(driver);
      }
    }

    // Actualizar memoria y estado persistido si hubo cambios
    const changed =
      newlyJoinedDrivers.length > 0 ||
      currentMap.size !== this.previousConnectedDrivers.size;

    this.previousConnectedDrivers.clear();
    for (const [name, driver] of currentMap.entries()) {
      this.previousConnectedDrivers.set(name, driver.carModel);
    }

    if (changed) {
      await this.savePersistedState();
    }

    if (newlyJoinedDrivers.length === 0) return;

    const alertChannel = (await this.client.channels
      .fetch(env.ALERT_CHANNEL_ID)
      .catch(() => null)) as TextChannel | null;

    if (!alertChannel || !alertChannel.isTextBased() || !('send' in alertChannel)) {
      console.warn(`⚠️ [Monitor] Canal de avisos (${env.ALERT_CHANNEL_ID}) no encontrado o sin permisos de envío.`);
      return;
    }

    console.log(
      `🏎️ [Monitor] Enviando aviso al canal #${alertChannel.name} (${alertChannel.id}) para ${newlyJoinedDrivers.length} piloto(s): ${newlyJoinedDrivers.map((d) => `${d.name} (${d.carModel})`).join(', ')}`
    );

    for (const driver of newlyJoinedDrivers) {
      try {
        const flag = emperorService.formatNationFlag(driver.nation);
        const flagPrefix = flag ? `${flag} ` : '';

        const joinEmbed = new EmbedBuilder()
          .setTitle('Piloto en pista')
          .setDescription(
            `**Piloto:** ${flagPrefix}**${driver.name}**\n` +
              `**Auto:** *${driver.carModel}*\n` +
              `**Circuito:** ${status.trackName} (${status.sessionType}) • **${status.connectedDriversCount}/${status.maxClients}** conectados`
          )
          .setColor(0x2ecc71)
          .setTimestamp(new Date());

        if (status.trackPreviewUrl) {
          joinEmbed.setThumbnail(status.trackPreviewUrl);
        }

        let files: AttachmentBuilder[] | undefined;
        if (status.trackLayoutUrl) {
          try {
            const mapAttachment = await trackMapService.getHorizontalTrackMapAttachment(
              status.trackLayoutUrl,
              `${status.trackName}_${status.trackConfig || ''}`
            );
            if (mapAttachment) {
              joinEmbed.setImage(mapAttachment.attachmentUrl);
              files = [mapAttachment.attachment];
            } else {
              joinEmbed.setImage(status.trackLayoutUrl);
            }
          } catch (mapErr) {
            console.warn('⚠️ No se pudo procesar el layout de circuito, usando imagen directa:', mapErr);
            joinEmbed.setImage(status.trackLayoutUrl);
          }
        }

        await alertChannel.send({
          embeds: [joinEmbed],
          files,
        });

        console.log(
          `✅ [Aviso Enviado] Piloto en pista: ${driver.name} (${driver.carModel}) en #${alertChannel.name}`
        );
      } catch (error) {
        console.error(`❌ Error al enviar aviso de ingreso de piloto (${driver.name}):`, error);
      }
    }
  }

  /**
   * Sistema de Alerta Inteligente (Smart Ping):
   * Menciona al rol cuando se juntan 3+ pilotos en pista (con cooldown de 60 minutos).
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
      return;
    }

    const alertChannel = await this.client.channels
      .fetch(env.ALERT_CHANNEL_ID)
      .catch(() => null);

    if (!alertChannel || !alertChannel.isTextBased() || !('send' in alertChannel)) {
      return;
    }

    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();
    const liveTimingWebUrl = emperorService.getLiveTimingWebUrl();
    const driversNames = status.drivers
      .map((d) => `**${d.name}** (${d.carModel})`)
      .join(', ');

    const alertEmbed = new EmbedBuilder()
      .setTitle('¡Se armó acción en pista!')
      .setURL(liveTimingWebUrl)
      .setDescription(
        `Ya hay **${status.connectedDriversCount}/${status.maxClients}** pilotos girando en **${status.trackName}** (${status.sessionType}).\n\n` +
          `**En pista:** ${driversNames || 'Varios pilotos'}`
      )
      .setColor(0x2ecc71)
      .setTimestamp(new Date());

    if (status.trackPreviewUrl) {
      alertEmbed.setThumbnail(status.trackPreviewUrl);
    }

    let files: AttachmentBuilder[] | undefined;
    if (status.trackLayoutUrl) {
      const mapAttachment = await trackMapService.getHorizontalTrackMapAttachment(
        status.trackLayoutUrl,
        `${status.trackName}_${status.trackConfig || ''}`
      );
      if (mapAttachment) {
        alertEmbed.setImage(mapAttachment.attachmentUrl);
        files = [mapAttachment.attachment];
      } else {
        alertEmbed.setImage(status.trackLayoutUrl);
      }
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL(liveTimingWebUrl)
    );

    try {
      await (alertChannel as TextChannel).send({
        content: `<@&${env.ALERT_ROLE_ID}> ¡Hay gente girando en el servidor!`,
        embeds: [alertEmbed],
        components: [row],
        files,
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

  /**
   * Detecta automáticamente cuando termina una sesión con vueltas válidas en Emperor Server
   * y publica la tabla de resultados en el canal de alertas.
   */
  private async evaluateNewSessionResult(): Promise<void> {
    const latestResult = await emperorService.getLatestSessionResult();
    if (!latestResult) return;

    if (!this.lastResultFile) {
      this.lastResultFile = latestResult.fileName;
      await this.savePersistedState();
      return;
    }

    if (this.lastResultFile === latestResult.fileName) {
      return;
    }

    this.lastResultFile = latestResult.fileName;
    await this.savePersistedState();

    const alertChannel = await this.client.channels
      .fetch(env.ALERT_CHANNEL_ID)
      .catch(() => null);

    if (!alertChannel || !alertChannel.isTextBased() || !('send' in alertChannel)) {
      return;
    }

    try {
      const payload = await buildSessionResultMessagePayload(latestResult);
      await (alertChannel as TextChannel).send(payload);
      console.log(
        `🏁 Resultado de sesión publicado automáticamente: ${latestResult.fileName}`
      );
    } catch (error) {
      console.error('❌ Error al publicar resultado automático:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const raw = await readFile(STATE_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw) as PersistedBotState;
      if (data.statusMessageId) {
        this.statusMessageId = data.statusMessageId;
      }
      if (data.lastResultFile) {
        this.lastResultFile = data.lastResultFile;
      }
      if (data.connectedDrivers) {
        this.previousConnectedDrivers = new Map(
          Object.entries(data.connectedDrivers)
        );
      }
    } catch {
      // Archivo aún no existe
    }
  }

  private async savePersistedState(): Promise<void> {
    try {
      await mkdir(STATE_DIR, { recursive: true });
      const state: PersistedBotState = {
        statusMessageId: this.statusMessageId ?? undefined,
        lastResultFile: this.lastResultFile ?? undefined,
        connectedDrivers: Object.fromEntries(this.previousConnectedDrivers),
      };
      await writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('⚠️ No se pudo guardar el estado local del bot:', error);
    }
  }
}
