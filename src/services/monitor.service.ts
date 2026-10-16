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
  type ConnectedDriver,
  type ServerLiveStatus,
} from './emperor.service.js';
import {
  buildServerStatusMessagePayload,
  buildSessionResultMessagePayload,
} from '../utils/embed.util.js';

interface PersistedBotState {
  statusMessageId?: string;
  lastResultFile?: string;
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
  private isFirstTick = true;
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
      this.isFirstTick = false;
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
   * mostrando el nombre del piloto y el auto que está usando.
   */
  private async evaluateDriverJoinAlerts(
    status: ServerLiveStatus
  ): Promise<void> {
    if (!status.online) {
      this.previousConnectedDrivers.clear();
      return;
    }

    const currentMap = new Map<string, ConnectedDriver>();
    for (const driver of status.drivers) {
      currentMap.set(driver.name, driver);
    }

    // En el primer tick después de arrancar el bot sincronizamos quiénes ya estaban adentro
    if (this.isFirstTick) {
      this.previousConnectedDrivers.clear();
      for (const [name, driver] of currentMap.entries()) {
        this.previousConnectedDrivers.set(name, driver.carModel);
      }
      return;
    }

    const newlyJoinedDrivers: ConnectedDriver[] = [];
    for (const [name, driver] of currentMap.entries()) {
      const prevCar = this.previousConnectedDrivers.get(name);
      if (!prevCar || prevCar !== driver.carModel) {
        newlyJoinedDrivers.push(driver);
      }
    }

    // Actualizar memoria para el próximo ciclo
    this.previousConnectedDrivers.clear();
    for (const [name, driver] of currentMap.entries()) {
      this.previousConnectedDrivers.set(name, driver.carModel);
    }

    if (newlyJoinedDrivers.length === 0) return;

    const alertChannel = await this.client.channels
      .fetch(env.ALERT_CHANNEL_ID)
      .catch(() => null);

    if (!alertChannel || !alertChannel.isTextBased() || !('send' in alertChannel)) {
      return;
    }

    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();
    const liveTimingWebUrl = emperorService.getLiveTimingWebUrl();

    for (const driver of newlyJoinedDrivers) {
      const nationBadge = driver.nation ? ` **[${driver.nation}]**` : '';

      const joinEmbed = new EmbedBuilder()
        .setTitle('🟢 ¡Piloto en pista!')
        .setURL(liveTimingWebUrl)
        .setDescription(
          `👤 **Piloto:** **${driver.name}**${nationBadge}\n` +
            `🏎️ **Auto:** *${driver.carModel}*\n` +
            `📍 **Circuito:** ${status.trackName} (${status.sessionType}) • 👥 **${status.connectedDriversCount}/${status.maxClients}** conectados`
        )
        .setColor(0x2ecc71)
        .setTimestamp(new Date());

      if (status.trackPreviewUrl) {
        joinEmbed.setThumbnail(status.trackPreviewUrl);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Entrar a Pista')
          .setStyle(ButtonStyle.Link)
          .setURL(buttonJoinUrl)
          .setEmoji('🏎️'),
        new ButtonBuilder()
          .setLabel('Live Timing Web')
          .setStyle(ButtonStyle.Link)
          .setURL(liveTimingWebUrl)
          .setEmoji('📊')
      );

      try {
        await (alertChannel as TextChannel).send({
          embeds: [joinEmbed],
          components: [row],
        });
        console.log(
          `🏎️ Aviso de ingreso enviado: ${driver.name} (${driver.carModel})`
        );
      } catch (error) {
        console.error('❌ Error al enviar aviso de ingreso de piloto:', error);
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
      .setTitle('🔥 ¡Se armó acción en pista!')
      .setURL(liveTimingWebUrl)
      .setDescription(
        `Ya hay **${status.connectedDriversCount}/${status.maxClients}** pilotos girando en **${status.trackName}** (${status.sessionType}).\n\n` +
          `👥 **En pista:** ${driversNames || 'Varios pilotos'}`
      )
      .setColor(0x2ecc71)
      .setTimestamp(new Date());

    if (status.trackPreviewUrl) {
      alertEmbed.setThumbnail(status.trackPreviewUrl);
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🚀'),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL(liveTimingWebUrl)
        .setEmoji('📊')
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

  /**
   * Detecta automáticamente cuando termina una sesión con vueltas válidas en Emperor Server
   * y publica la tabla de resultados en el canal de alertas.
   */
  private async evaluateNewSessionResult(): Promise<void> {
    const latestResult = await emperorService.getLatestSessionResult();
    if (!latestResult) return;

    // Si todavía no teníamos guardado ningún archivo, guardamos el actual como referencia inicial
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
      const payload = buildSessionResultMessagePayload(latestResult);
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
      };
      await writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('⚠️ No se pudo guardar el estado local del bot:', error);
    }
  }
}
