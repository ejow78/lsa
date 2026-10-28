import {
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';

export const encuestaCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('encuesta')
    .setDescription('Crea una votación / encuesta oficial en este canal (Solo Moderadores)')
    .addStringOption((opt) =>
      opt
        .setName('pregunta')
        .setDescription('La pregunta o tema de la votación')
        .setRequired(true)
        .setMaxLength(300)
    )
    .addStringOption((opt) =>
      opt.setName('opcion1').setDescription('Opción 1').setRequired(true).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion2').setDescription('Opción 2').setRequired(true).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion3').setDescription('Opción 3 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion4').setDescription('Opción 4 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion5').setDescription('Opción 5 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion6').setDescription('Opción 6 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion7').setDescription('Opción 7 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion8').setDescription('Opción 8 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion9').setDescription('Opción 9 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addStringOption((opt) =>
      opt.setName('opcion10').setDescription('Opción 10 (opcional)').setRequired(false).setMaxLength(55)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('duracion')
        .setDescription('Duración de la encuesta (por defecto: 24 horas)')
        .setRequired(false)
        .addChoices(
          { name: '1 hora', value: 1 },
          { name: '4 horas', value: 4 },
          { name: '8 horas', value: 8 },
          { name: '24 horas (1 día)', value: 24 },
          { name: '72 horas (3 días)', value: 72 },
          { name: '1 semana (7 días)', value: 168 }
        )
    )
    .addBooleanOption((opt) =>
      opt
        .setName('seleccion_multiple')
        .setDescription('¿Permitir votar más de una opción? (por defecto: No)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member as GuildMember | null;

    const hasModRole =
      member?.roles instanceof GuildMemberRoleManager
        ? member.roles.cache.has(env.MOD_ROLE_ID)
        : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);

    const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);

    if (!hasModRole && !isAdmin) {
      await interaction.reply({
        content:
          'No tienes permisos para crear encuestas. Esta función está reservada para moderadores y administradores.',
        ephemeral: true,
      });
      return;
    }

    const pregunta = interaction.options.getString('pregunta', true);
    const duracion = interaction.options.getInteger('duracion') ?? 24;
    const seleccionMultiple = interaction.options.getBoolean('seleccion_multiple') ?? false;

    // Recolectar opciones no vacías
    const answers: { text: string }[] = [];
    for (let i = 1; i <= 10; i++) {
      const val = interaction.options.getString(`opcion${i}`);
      if (val && val.trim().length > 0) {
        answers.push({ text: val.trim() });
      }
    }

    if (answers.length < 2) {
      await interaction.reply({
        content: 'Debes ingresar al menos 2 opciones para la encuesta.',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    if (!channel || !('send' in channel)) {
      await interaction.reply({
        content: 'No se puede enviar la encuesta en este canal.',
        ephemeral: true,
      });
      return;
    }

    try {
      // Envía la encuesta nativa de Discord
      await (channel as TextChannel).send({
        poll: {
          question: { text: pregunta },
          answers: answers.map((a) => ({ text: a.text })),
          duration: duracion,
          allowMultiselect: seleccionMultiple,
        },
      });

      await interaction.reply({
        content: `Encuesta creada con éxito. Duración: **${duracion}h** | Selección múltiple: **${seleccionMultiple ? 'Sí' : 'No'}**`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error al enviar la encuesta nativa:', err);
      await interaction.reply({
        content: 'Error al publicar la encuesta. Asegúrate de que el bot tenga permisos para enviar mensajes y encuestas en este canal.',
        ephemeral: true,
      });
    }
  },
};
