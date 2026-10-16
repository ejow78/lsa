import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';
import { emperorService } from '../services/emperor.service.js';

export const linkCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription(
      'Devuelve el enlace directo a Content Manager, contraseña y botón para entrar en 1-Click'
    ),

  async execute(interaction) {
    const directProtocolLink = emperorService.getContentManagerProtocolLink();
    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();

    const fields = [
      {
        name: '🌐 Enlace Web 1-Click (Para entrar o compartir)',
        value: buttonJoinUrl,
      },
      {
        name: '📋 Protocolo directo Content Manager',
        value: `\`\`\`\n${directProtocolLink}\n\`\`\``,
      },
    ];

    if (env.AC_SERVER_PASSWORD) {
      fields.unshift({
        name: '🔑 Contraseña del Servidor',
        value: `\`${env.AC_SERVER_PASSWORD}\``,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔗 Acceso al Servidor — LATAM SimRacing Alliance')
      .setDescription(
        'Haz clic en el botón de abajo para abrir **Content Manager** directamente (ya incluye la contraseña):'
      )
      .addFields(fields)
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
