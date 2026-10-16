import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';

export const linkCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription(
      'Devuelve el enlace directo a Content Manager en texto y botón para entrar o compartir'
    ),

  async execute(interaction) {
    const directProtocolLink = emperorService.getContentManagerProtocolLink();
    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();

    const embed = new EmbedBuilder()
      .setTitle('🔗 Enlace Directo — Content Manager')
      .setDescription(
        'Haz clic en el botón de abajo para abrir **Content Manager** directamente o copia el enlace manual:'
      )
      .addFields(
        {
          name: '📋 Protocolo directo (Copiar y pegar en navegador / CM)',
          value: `\`\`\`\n${directProtocolLink}\n\`\`\``,
        },
        {
          name: '🌐 Enlace Web 1-Click (Para compartir)',
          value: buttonJoinUrl,
        }
      )
      .setColor(0x3498db)
      .setTimestamp(new Date());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista (1-Click Content Manager)')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🏎️')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
