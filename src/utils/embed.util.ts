import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { env } from '../config/env.js';
import {
  emperorService,
  type ServerLiveStatus,
} from '../services/emperor.service.js';

const COLOR_ACTIVE_GREEN = 0x2ecc71;
const COLOR_EMPTY_GREY = 0x95a5a6;
const COLOR_OFFLINE_RED = 0xe74c3c;

/**
 * Construye el Embed principal del estado del servidor y la fila de botones interactivos.
 */
export function buildServerStatusMessagePayload(status: ServerLiveStatus): {
  embeds: [EmbedBuilder];
  components: [ActionRowBuilder<ButtonBuilder>];
} {
  const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();
  const liveTimingWebUrl = emperorService.getLiveTimingWebUrl();

  if (!status.online) {
    const offlineEmbed = new EmbedBuilder()
      .setTitle('🔴 Servidor fuera de línea / Reiniciando')
      .setDescription(
        'No se pudo obtener respuesta del servidor de Assetto Corsa en este momento. El monitor volverá a consultar automáticamente.'
      )
      .setColor(COLOR_OFFLINE_RED)
      .setTimestamp(status.updatedAt)
      .setFooter({ text: 'LATAM SimRacing Alliance • Monitor en Vivo' });

    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🏎️')
        .setDisabled(true),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL(liveTimingWebUrl)
        .setEmoji('📊')
    );

    return { embeds: [offlineEmbed], components: [disabledRow] };
  }

  const isActive = status.connectedDriversCount > 0;
  const embedColor = isActive ? COLOR_ACTIVE_GREEN : COLOR_EMPTY_GREY;
  const statusIndicator = isActive ? '🟢 Pista Activa' : '⚪ Pista Vacía';

  const fullTrackTitle = status.trackConfig
    ? `${status.trackName} (${status.trackConfig})`
    : status.trackName;

  const weatherText =
    status.ambientTemp !== undefined && status.roadTemp !== undefined
      ? ` • 🌡️ ${status.ambientTemp}°C Amb / ${status.roadTemp}°C Pista`
      : '';

  const passwordLine = env.AC_SERVER_PASSWORD
    ? `\n**Contraseña:** \`${env.AC_SERVER_PASSWORD}\``
    : '';

  const driversListText =
    status.drivers.length > 0
      ? status.drivers
          .slice(0, 24)
          .map((driver, idx) => {
            const nationText = driver.nation ? ` [${driver.nation}]` : '';
            const lapText = driver.bestLap ? ` • ⏱️ \`${driver.bestLap}\`` : '';
            return `\`${String(idx + 1).padStart(2, '0')}.\` **${driver.name}**${nationText} — *${driver.carModel}*${lapText}`;
          })
          .join('\n')
      : '*No hay pilotos conectados en este momento. ¡Sé el primero en salir a girar!*';

  const embed = new EmbedBuilder()
    .setTitle(`🏁 ${status.serverName}`)
    .setURL(liveTimingWebUrl)
    .setDescription(`**Estado:** ${statusIndicator}${weatherText}${passwordLine}`)
    .setColor(embedColor)
    .addFields(
      {
        name: '📍 Circuito y Trazado',
        value: fullTrackTitle,
        inline: true,
      },
      {
        name: '⏱️ Sesión Actual',
        value: `**${status.sessionType}** (${status.timeLeftFormatted} rest.)`,
        inline: true,
      },
      {
        name: '👥 Pilotos en Pista',
        value: `**${status.connectedDriversCount}/${status.maxClients}**`,
        inline: true,
      },
      {
        name: `🏎️ Lista de Pilotos (${status.connectedDriversCount})`,
        value: driversListText,
        inline: false,
      }
    )
    .setTimestamp(status.updatedAt)
    .setFooter({ text: 'LATAM SimRacing Alliance • Actualización en vivo' });

  if (status.trackPreviewUrl) {
    embed.setImage(status.trackPreviewUrl);
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

  return { embeds: [embed], components: [row] };
}
