import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';
import { buildServerStatusMessagePayload } from '../utils/embed.util.js';

export const servidorCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('servidor')
    .setDescription(
      'Muestra el estado actual del servidor de Assetto Corsa en tiempo real y el botón 1-Click'
    )
    .addBooleanOption((option) =>
      option
        .setName('publico')
        .setDescription('Si es true, el mensaje será visible para todo el canal (por defecto: solo para ti)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const isPublic = interaction.options.getBoolean('publico') ?? false;
    await interaction.deferReply({ ephemeral: !isPublic });

    const status = await emperorService.getLiveStatus();
    const payload = buildServerStatusMessagePayload(status);

    await interaction.editReply(payload);
  },
};
