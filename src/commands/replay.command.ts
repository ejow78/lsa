import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';
import { env } from '../config/env.js';

export const replayCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('replay')
    .setDescription('Obtiene los enlaces directos de descarga para las repeticiones recientes (.acreplay)'),

  async execute(interaction) {
    await interaction.deferReply();

    const fileNames = await emperorService.getRecentResultFileNames(5);
    const base = env.EMPEROR_WEB_URL.replace(/\/+$/, '');

    if (!fileNames || fileNames.length === 0) {
      await interaction.editReply({
        content: '⚠️ No se encontraron archivos de sesiones ni repeticiones recientes en el servidor.',
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎬 Repeticiones de Servidor Assetto Corsa (.acreplay)')
      .setColor(0xe67e22)
      .setDescription(
        'Descarga el archivo `.acreplay` y colócalo en tu carpeta:\n' +
        '`Documentos\\Assetto Corsa\\replay` para verla en tu juego o Content Manager.'
      )
      .setFooter({ text: 'LATAM SimRacing Alliance • Servidor Emperor' })
      .setTimestamp(new Date());

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    fileNames.slice(0, 4).forEach((file, index) => {
      const slug = file.replace(/\.json$/i, '');
      const downloadUrl = `${base}/results/download/${slug}.acreplay`;
      const prettyName = slug
        .replace(/_/g, ' ')
        .replace(/\b(\w)/g, (c) => c.toUpperCase());

      embed.addFields({
        name: `Sesión #${index + 1}: ${prettyName}`,
        value: `[📥 Descargar .acreplay](${downloadUrl}) • [📊 Ver Resumen Web](${base}/results/${slug})`,
        inline: false,
      });

      if (rows.length < 2) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel(`Descargar #${index + 1} (.acreplay)`)
            .setStyle(ButtonStyle.Link)
            .setURL(downloadUrl),
          new ButtonBuilder()
            .setLabel(`Ver Web #${index + 1}`)
            .setStyle(ButtonStyle.Link)
            .setURL(`${base}/results/${slug}`)
        );
        rows.push(row);
      }
    });

    await interaction.editReply({
      embeds: [embed],
      components: rows,
    });
  },
};
