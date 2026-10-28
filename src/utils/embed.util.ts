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
  type SessionResultSummary,
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
      .setTitle('Servidor fuera de línea / Reiniciando')
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
        .setDisabled(true),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL(liveTimingWebUrl)
    );

    return { embeds: [offlineEmbed], components: [disabledRow] };
  }

  const isActive = status.connectedDriversCount > 0;
  const embedColor = isActive ? COLOR_ACTIVE_GREEN : COLOR_EMPTY_GREY;
  const statusIndicator = isActive ? 'Pista Activa' : 'Pista Vacía';

  const fullTrackTitle = status.trackConfig
    ? `${status.trackName} (${status.trackConfig})`
    : status.trackName;

  const weatherText =
    status.ambientTemp !== undefined && status.roadTemp !== undefined
      ? ` • ${status.ambientTemp}°C Ambiente / ${status.roadTemp}°C Pista`
      : '';

  const passwordLine = env.AC_SERVER_PASSWORD
    ? `\n**Contraseña:** \`${env.AC_SERVER_PASSWORD}\``
    : '';

  const driversListText =
    status.drivers.length > 0
      ? status.drivers
          .slice(0, 24)
          .map((driver, idx) => {
            const flag = emperorService.formatNationFlag(driver.nation);
            const flagText = flag ? ` ${flag}` : '';
            const lapText = driver.bestLap ? ` • \`${driver.bestLap}\`` : '';
            return `\`${String(idx + 1).padStart(2, '0')}.\`${flagText} **${driver.name}** — *${driver.carModel}*${lapText}`;
          })
          .join('\n')
      : '*No hay pilotos conectados en este momento.*';

  const embed = new EmbedBuilder()
    .setTitle(status.serverName)
    .setURL(liveTimingWebUrl)
    .setDescription(`**Estado:** ${statusIndicator}${weatherText}${passwordLine}`)
    .setColor(embedColor)
    .addFields(
      {
        name: 'Circuito y Trazado',
        value: fullTrackTitle,
        inline: true,
      },
      {
        name: 'Sesión Actual',
        value: `**${status.sessionType}** (${status.timeLeftFormatted} restantes)`,
        inline: true,
      },
      {
        name: 'Pilotos en Pista',
        value: `**${status.connectedDriversCount}/${status.maxClients}**`,
        inline: true,
      },
      {
        name: `Lista de Pilotos (${status.connectedDriversCount})`,
        value: driversListText,
        inline: false,
      }
    )
    .setTimestamp(status.updatedAt)
    .setFooter({ text: 'LATAM SimRacing Alliance • Actualización en vivo' });

  if (status.trackPreviewUrl) {
    embed.setThumbnail(status.trackPreviewUrl);
  }
  if (status.trackLayoutUrl) {
    embed.setImage(status.trackLayoutUrl);
  } else if (status.trackPreviewUrl) {
    embed.setImage(status.trackPreviewUrl);
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

  return { embeds: [embed], components: [row] };
}

/**
 * Construye el Embed de resultados de una sesión finalizada (Practice, Qualy o Race).
 */
export function buildSessionResultMessagePayload(result: SessionResultSummary): {
  embeds: [EmbedBuilder];
  components: [ActionRowBuilder<ButtonBuilder>];
} {
  const standingsText = result.standings
    .slice(0, 15)
    .map((entry) => {
      const prefix = `\`${String(entry.position).padStart(2, '0')}.\``;
      const gapStr = entry.gapFormatted ? ` (${entry.gapFormatted})` : '';
      const lapsWord = entry.numLaps === 1 ? 'vuelta' : 'vueltas';
      const incWord = entry.incidentsCount === 1 ? 'incidente' : 'incidentes';
      const incStr =
        entry.incidentsCount > 0 ? ` • ${entry.incidentsCount} ${incWord}` : '';
      return `${prefix} **${entry.driverName}** — *${entry.carModel}*\n└ \`${entry.bestLapFormatted}\`${gapStr} • ${entry.numLaps} ${lapsWord}${incStr}`;
    })
    .join('\n');

  const fastestLapLine = result.fastestLap
    ? `\n**Vuelta Rápida:** **${result.fastestLap.driverName}** (\`${result.fastestLap.lapFormatted}\` — *${result.fastestLap.carModel}*)`
    : '';

  const embed = new EmbedBuilder()
    .setTitle(`Resultados de ${result.sessionType} — ${result.trackName}`)
    .setURL(result.webUrl)
    .setDescription(
      `**Fecha:** ${result.dateFormatted}\n` +
        `**Vueltas totales:** ${result.totalLaps} • **Incidentes:** ${result.totalIncidents}${fastestLapLine}`
    )
    .setColor(0x9b59b6)
    .addFields({
      name: `Clasificación (${result.standings.length} registros)`,
      value: standingsText || '*Sin tiempos registrados.*',
      inline: false,
    })
    .setThumbnail(result.trackPreviewUrl)
    .setTimestamp(new Date())
    .setFooter({ text: 'LATAM SimRacing Alliance • Telemetría Oficial' });

  if (result.trackLayoutUrl) {
    embed.setImage(result.trackLayoutUrl);
  }

  const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');
  const replaySlug = result.fileName.replace(/\.json$/i, '');
  const replayUrl = `${base}/results/download/${replaySlug}.acreplay`;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('📥 Descargar Replay')
      .setStyle(ButtonStyle.Link)
      .setURL(replayUrl),
    new ButtonBuilder()
      .setLabel('Ver Telemetría en Web')
      .setStyle(ButtonStyle.Link)
      .setURL(result.webUrl),
    new ButtonBuilder()
      .setLabel('Todos los Resultados')
      .setStyle(ButtonStyle.Link)
      .setURL(emperorService.getResultsWebUrl())
  );

  return { embeds: [embed], components: [row] };
}
