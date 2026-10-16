import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
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
  const directProtocolLink = emperorService.getContentManagerProtocolLink();
  const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();

  if (!status.online) {
    const offlineEmbed = new EmbedBuilder()
      .setTitle('🔴 Servidor fuera de línea / Reiniciando')
      .setDescription(
        'No se pudo obtener respuesta del servidor de Assetto Corsa en este momento. El monitor volverá a consultar automáticamente.'
      )
      .setColor(COLOR_OFFLINE_RED)
      .setTimestamp(status.updatedAt)
      .setFooter({ text: 'Monitor en Vivo • Assetto Corsa' });

    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista (1-Click CM)')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🏎️')
        .setDisabled(true)
    );

    return { embeds: [offlineEmbed], components: [disabledRow] };
  }

  const isActive = status.connectedDriversCount > 0;
  const embedColor = isActive ? COLOR_ACTIVE_GREEN : COLOR_EMPTY_GREY;
  const statusIndicator = isActive ? '🟢 Pista Activa' : '⚪ Pista Vacía';

  const fullTrackTitle = status.trackConfig
    ? `${status.trackName} (${status.trackConfig})`
    : status.trackName;

  const driversListText =
    status.drivers.length > 0
      ? status.drivers
          .slice(0, 24)
          .map((driver, idx) => {
            const lapText = driver.bestLap ? ` • ⏱️ \`${driver.bestLap}\`` : '';
            return `\`${String(idx + 1).padStart(2, '0')}.\` **${driver.name}** — *${driver.carModel}*${lapText}`;
          })
          .join('\n')
      : '*No hay pilotos conectados en este momento. ¡Sé el primero en salir a girar!*';

  const embed = new EmbedBuilder()
    .setTitle(`🏁 ${status.serverName}`)
    .setDescription(`**Estado:** ${statusIndicator}\n**Acceso directo CM:** \`${directProtocolLink}\``)
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
    .setFooter({ text: 'Actualización automática • Assetto Corsa Telemetry' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Entrar a Pista (1-Click Content Manager)')
      .setStyle(ButtonStyle.Link)
      .setURL(buttonJoinUrl)
      .setEmoji('🏎️')
  );

  return { embeds: [embed], components: [row] };
}
