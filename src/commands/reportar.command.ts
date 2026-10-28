import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import type { SlashCommand } from './types.js';

export const reportarCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reportar')
    .setDescription('Envía una denuncia de incidente en pista a los comisarios deportivos'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('modal_report_incident')
      .setTitle('Denuncia de Incidente en Pista');

    const accusedInput = new TextInputBuilder()
      .setCustomId('report_accused')
      .setLabel('Piloto o Auto Denunciado')
      .setPlaceholder('Ej: Juan Pérez / Auto #45 Ferrari')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const sessionTimeInput = new TextInputBuilder()
      .setCustomId('report_session_time')
      .setLabel('Sesión / Vuelta / Minuto aproximado')
      .setPlaceholder('Ej: Carrera 1, Vuelta 5 (Min 08:30)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const videoUrlInput = new TextInputBuilder()
      .setCustomId('report_video_url')
      .setLabel('Link del Video de la maniobra')
      .setPlaceholder('YouTube, Twitch, Streamable o Google Drive')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(250);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('report_description')
      .setLabel('Descripción de lo ocurrido')
      .setPlaceholder('Explica brevemente la maniobra (toque, cierre indebido, rejoin inseguro, etc.)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(accusedInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(sessionTimeInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(videoUrlInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
  },
};
