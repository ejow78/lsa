import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from './types.js';
import { tablesService } from '../services/tables.service.js';

export const tablaCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tabla')
    .setDescription(
      'Muestra las tablas de posiciones de Assetto Corsa o Assetto Corsa Competizione gestionadas en la web'
    )
    .addStringOption((option) =>
      option
        .setName('simulador')
        .setDescription('Filtrar por simulador (ac = Assetto Corsa, acc = Assetto Corsa Competizione)')
        .setRequired(false)
        .addChoices(
          { name: 'Assetto Corsa', value: 'ac' },
          { name: 'Assetto Corsa Competizione', value: 'acc' }
        )
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
    const simFilter = interaction.options.getString('simulador') as
      | 'ac'
      | 'acc'
      | null;
    const isPublic = interaction.options.getBoolean('publico') ?? false;
    await interaction.deferReply({ ephemeral: !isPublic });

    const tables = simFilter
      ? await tablesService.getTablesBySim(simFilter)
      : await tablesService.getAllTables();

    if (tables.length === 0) {
      await interaction.editReply({
        content: 'No hay tablas cargadas para esa categoría en este momento.',
      });
      return;
    }

    const embeds = tables
      .slice(0, 4)
      .map((table) => tablesService.buildTableEmbed(table));

    await interaction.editReply({ embeds });
  },
};
