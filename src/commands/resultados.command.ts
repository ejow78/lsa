import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';
import { buildSessionResultMessagePayload } from '../utils/embed.util.js';

export const resultadosCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('resultados')
    .setDescription(
      'Muestra la clasificación, vuelta rápida e incidentes de la última sesión finalizada'
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
    const isPublic = interaction.options.getBoolean('publico') ?? false;
    await interaction.deferReply({ ephemeral: !isPublic });

    const latestResult = await emperorService.getLatestSessionResult();
    if (!latestResult) {
      await interaction.editReply({
        content:
          '⚠️ No se encontraron resultados recientes con vueltas registradas.',
      });
      return;
    }

    const payload = buildSessionResultMessagePayload(latestResult);
    await interaction.editReply(payload);
  },
};
