import {
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';

export const pilotoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('piloto')
    .setDescription(
      'Muestra la ficha de telemetría de un piloto: mejor vuelta, vuelta ideal, autos probados e incidentes'
    )
    .addStringOption((option) =>
      option
        .setName('nombre')
        .setDescription(
          'Nombre o parte del nombre del piloto (ej: Javier, Alonso). Si lo dejas vacío muestra el primero.'
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('publico')
        .setDescription(
          'Si es true, el mensaje será visible para todo el canal (por defecto: solo para ti)'
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const queryName = interaction.options.getString('nombre') ?? undefined;
    const isPublic = interaction.options.getBoolean('publico') ?? false;
    await interaction.deferReply({ ephemeral: !isPublic });

    const profile = await emperorService.getDriverProfile(queryName);
    if (!profile) {
      await interaction.editReply({
        content: 'Todavía no hay datos de telemetría de pilotos en las sesiones recientes.',
      });
      return;
    }

    if (!profile.found) {
      const list = profile.availableDrivers.map((d) => `• \`${d}\``).join('\n');
      await interaction.editReply({
        content:
          `No encontré al piloto **"${queryName}"** en las sesiones recientes.\n\n` +
          `**Pilotos con tiempos registrados:**\n${list}`,
      });
      return;
    }

    const carsLines = profile.carsUsed.map((c) => {
      const lapsWord = c.lapsCount === 1 ? 'vuelta' : 'vueltas';
      const cleanWord = c.cleanLapsCount === 1 ? 'limpia' : 'limpias';
      return `• **${c.carModel}** — \`${c.bestLapFormatted}\` (${c.lapsCount} ${lapsWord} • ${c.cleanLapsCount} ${cleanWord})`;
    });

    const sectorsText = profile.bestSectorsFormatted
      ? `Sector 1: \`${profile.bestSectorsFormatted[0]}\` • Sector 2: \`${profile.bestSectorsFormatted[1]}\` • Sector 3: \`${profile.bestSectorsFormatted[2]}\``
      : 'Sin parciales';

    const cleanRate =
      profile.totalLaps > 0
        ? Math.round((profile.cleanLaps / profile.totalLaps) * 100)
        : 100;

    const totalLapsWord = profile.totalLaps === 1 ? 'vuelta' : 'vueltas';
    const totalIncWord = profile.totalIncidents === 1 ? 'incidente' : 'incidentes';

    const embed = new EmbedBuilder()
      .setTitle(`Telemetría de Piloto — ${profile.driverName}`)
      .setURL(emperorService.getResultsWebUrl())
      .setDescription(`**Circuito:** ${profile.trackName}`)
      .setColor(0x1abc9c)
      .addFields(
        {
          name: 'Mejor Vuelta',
          value: `**\`${profile.bestLapFormatted}\`**\n*(${profile.bestLapCar})*`,
          inline: true,
        },
        {
          name: 'Vuelta Óptima',
          value: profile.optimalLapFormatted
            ? `**\`${profile.optimalLapFormatted}\`**\n*(${sectorsText})*`
            : 'No disponible',
          inline: true,
        },
        {
          name: 'Estadísticas de Pista',
          value:
            `**${profile.totalLaps}** ${totalLapsWord} (${cleanRate}% limpias)\n` +
            `**${profile.totalIncidents}** ${totalIncWord}`,
          inline: true,
        },
        {
          name: `Comparativa de Autos Probados (${profile.carsUsed.length})`,
          value:
            carsLines.length > 0
              ? carsLines.join('\n').slice(0, 1024)
              : '*Sin vueltas registradas.*',
          inline: false,
        }
      )
      .setThumbnail(profile.trackPreviewUrl)
      .setTimestamp(new Date())
      .setFooter({
        text: `Otros pilotos en pista: ${profile.availableDrivers.join(', ')}`,
      });

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
