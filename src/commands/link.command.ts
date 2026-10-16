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
      'Devuelve el enlace directo a Content Manager, Live Timing, contraseña y botones 1-Click'
    ),

  async execute(interaction) {
    const directProtocolLink = emperorService.getContentManagerProtocolLink();
    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();
    const liveTimingWebUrl = emperorService.getLiveTimingWebUrl();

    const fields = [
      {
        name: '🌐 Enlace Web 1-Click (Para entrar o compartir)',
        value: buttonJoinUrl,
      },
      {
        name: '📊 Live Timing en Vivo',
        value: liveTimingWebUrl,
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
      .setURL(liveTimingWebUrl)
      .setDescription(
        'Haz clic en los botones de abajo para entrar con **Content Manager** en 1 clic o ver el **Live Timing Web**:'
      )
      .addFields(fields)
      .setColor(0x3498db)
      .setTimestamp(new Date());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista (1-Click CM)')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🏎️'),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL(liveTimingWebUrl)
        .setEmoji('📊')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
