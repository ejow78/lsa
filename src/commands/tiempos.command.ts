import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';

export const tiemposCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tiempos')
    .setDescription(
      'Muestra el Ranking de Mejores Tiempos (Hotlaps) registrados en el circuito actual'
    )
    .addBooleanOption((option) =>
      option
        .setName('por_auto')
        .setDescription(
          'Si es true, muestra el mejor tiempo de cada combinación Piloto + Auto (ideal para comparar autos)'
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
    const byCar = interaction.options.getBoolean('por_auto') ?? false;
    const isPublic = interaction.options.getBoolean('publico') ?? false;
    await interaction.deferReply({ ephemeral: !isPublic });

    const hotlaps = await emperorService.getTrackHotlaps(byCar);
    if (!hotlaps || hotlaps.entries.length === 0) {
      await interaction.editReply({
        content:
          'Todavía no se encontraron vueltas limpias registradas en las sesiones recientes.',
      });
      return;
    }

    const leaderboardLines = hotlaps.entries.slice(0, 15).map((entry) => {
      const prefix = `\`${String(entry.rank).padStart(2, '0')}.\``;
      const tyreStr = entry.tyre ? ` • Neumático: \`${entry.tyre}\`` : '';
      const lapsWord = entry.lapsCount === 1 ? 'vuelta' : 'vueltas';
      return (
        `${prefix} **${entry.driverName}** — *${entry.carModel}*\n` +
        `└ **\`${entry.bestLapFormatted}\`** (${entry.gapFormatted})${tyreStr} • ${entry.lapsCount} ${lapsWord}`
      );
    });

    const embed = new EmbedBuilder()
      .setTitle(`Ranking de Hotlaps — ${hotlaps.trackName}`)
      .setURL('https://live.latamsimracing.com/')
      .setColor(0xe67e22)
      .addFields({
        name: `Top Tiempos (${hotlaps.entries.length})`,
        value: leaderboardLines.join('\n').slice(0, 1024),
        inline: false,
      })
      .setThumbnail(hotlaps.trackPreviewUrl)
      .setTimestamp(new Date())
      .setFooter({
        text: 'Usa /tiempos por_auto:True para comparar todos los autos que probó cada piloto',
      });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista')
        .setStyle(ButtonStyle.Link)
        .setURL(emperorService.getContentManagerJoinButtonUrl()),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL('https://live.latamsimracing.com/')
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
