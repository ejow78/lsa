import {
  ChannelType,
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';

export const decirCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('decir')
    .setDescription('Envía un mensaje de texto plano con la cuenta del bot (Solo Administradores)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('mensaje')
        .setDescription('Texto que dirá el bot')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal de Discord donde enviar el mensaje (por defecto este canal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member as GuildMember | null;
    const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);
    const hasModRole =
      member?.roles instanceof GuildMemberRoleManager
        ? member.roles.cache.has(env.MOD_ROLE_ID)
        : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);

    if (!isAdmin && !hasModRole) {
      await interaction.reply({
        content: '❌ Solo los administradores pueden utilizar este comando.',
        ephemeral: true,
      });
      return;
    }

    const mensaje = interaction.options.getString('mensaje', true).replace(/\\n/g, '\n');
    const targetChannel =
      (interaction.options.getChannel('canal') as TextChannel | null) ||
      (interaction.channel as TextChannel | null);

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.reply({
        content: '❌ No se pudo encontrar el canal especificado o no es de texto.',
        ephemeral: true,
      });
      return;
    }

    try {
      await targetChannel.send({ content: mensaje });
      await interaction.reply({
        content: `✅ Mensaje enviado en <#${targetChannel.id}>.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error enviando mensaje con /decir:', err);
      await interaction.reply({
        content: '❌ Error al enviar el mensaje en el canal.',
        ephemeral: true,
      });
    }
  },
};
