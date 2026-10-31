import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';
import type { GameType } from '../services/reports.service.js';

export function buildReportModal(game: GameType): ModalBuilder {
  const gameTitle = game === 'ACC' ? 'Assetto Corsa Competizione' : 'Assetto Corsa';

  const modal = new ModalBuilder()
    .setCustomId(`modal_report_incident_${game}`)
    .setTitle(`Denuncia • ${gameTitle}`);

  const reporterNameInput = new TextInputBuilder()
    .setCustomId('report_driver_name')
    .setLabel('Tu Nombre de Piloto en Pista')
    .setPlaceholder('Ej: Tu nombre y apellido en el juego')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const accusedInput = new TextInputBuilder()
    .setCustomId('report_accused')
    .setLabel('Piloto o Auto Denunciado')
    .setPlaceholder('Ej: Juan Pérez / Auto #45 Ferrari')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const sessionTimeInput = new TextInputBuilder()
    .setCustomId('report_session_time')
    .setLabel('Sesión / Vuelta / Momento exacto')
    .setPlaceholder('Ej: Carrera 1, Vuelta 5 (Minuto 08:30)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('report_description')
    .setLabel('Descripción de lo ocurrido')
    .setPlaceholder('Explica detalladamente la maniobra (toque, cierre indebido, rejoin inseguro, etc.)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(reporterNameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(accusedInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(sessionTimeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
  );

  return modal;
}

export const reportarCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reportar')
    .setDescription('Envía una denuncia de incidente en pista a los comisarios deportivos (AC o ACC)')
    .addStringOption((option) =>
      option
        .setName('juego')
        .setDescription('Simulador en el que ocurrió el incidente')
        .setRequired(false)
        .addChoices(
          { name: 'Assetto Corsa (AC)', value: 'AC' },
          { name: 'Assetto Corsa Competizione (ACC)', value: 'ACC' }
        )
    ),

  async execute(interaction) {
    const specifiedGame = interaction.options.getString('juego') as GameType | null;

    // Si especificó el juego, abrimos el modal directamente
    if (specifiedGame === 'AC' || specifiedGame === 'ACC') {
      await interaction.showModal(buildReportModal(specifiedGame));
      return;
    }

    // Si se ejecutó en el canal de reportes de ACC
    if (interaction.channelId === env.accReportChannelId) {
      await interaction.showModal(buildReportModal('ACC'));
      return;
    }

    // Si se ejecutó en el canal de reportes de AC
    if (interaction.channelId === env.acReportChannelId) {
      await interaction.showModal(buildReportModal('AC'));
      return;
    }

    // Si no especificó y está en otro canal, le mostramos botones interactivos para elegir
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('open_report_modal_AC')
        .setLabel('Reportar en Assetto Corsa')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🏎️'),
      new ButtonBuilder()
        .setCustomId('open_report_modal_ACC')
        .setLabel('Reportar en ACC')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🏁')
    );

    await interaction.reply({
      content:
        `🏁 **LATAM SimRacing Alliance • Denuncias de Incidentes**\n\n` +
        `Selecciona el simulador en el que ocurrió el incidente que deseas denunciar:\n` +
        `• También puedes hacer tus reportes directamente en <#${env.acReportChannelId}> (AC) o <#${env.accReportChannelId}> (ACC).`,
      components: [row],
      ephemeral: true,
    });
  },
};
