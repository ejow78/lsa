import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';

export interface GameRoleDefinition {
  id: string;
  name: string;
  label: string;
  emoji: string;
  color: number;
}

export const GAME_ROLES_LIST: GameRoleDefinition[] = [
  {
    id: 'ac',
    name: 'Assetto Corsa',
    label: 'Assetto Corsa',
    emoji: '<:AC:1538221321391968276>',
    color: 0xe74c3c,
  },
  {
    id: 'acc',
    name: 'Assetto Corsa Competizione',
    label: 'ACC',
    emoji: '<:ACC:1538222193995944099>',
    color: 0xe67e22,
  },
  {
    id: 'acevo',
    name: 'Assetto Corsa EVO',
    label: 'AC EVO',
    emoji: '<:ACEVO:1538222336292028488>',
    color: 0x9b59b6,
  },
  {
    id: 'iracing',
    name: 'iRacing',
    label: 'iRacing',
    emoji: '<:iracing_logo:1538223744571408384>',
    color: 0x3498db,
  },
  {
    id: 'lmu',
    name: 'Le Mans Ultimate',
    label: 'Le Mans Ultimate',
    emoji: '<:LeMansUltimateLogo:1538224347691491428>',
    color: 0x1abc9c,
  },
  {
    id: 'f1',
    name: 'F1',
    label: 'F1',
    emoji: '<:F1logo:1538222743881916486>',
    color: 0xe74c3c,
  },
  {
    id: 'wrc',
    name: 'EA Sports WRC',
    label: 'EA Sports WRC',
    emoji: '<:WRC:1538223219142828092>',
    color: 0x2ecc71,
  },
  {
    id: 'acrally',
    name: 'Assetto Corsa Rally',
    label: 'AC Rally',
    emoji: '<:ACRally:1538224420986814536>',
    color: 0xe67e22,
  },
  {
    id: 'dr20',
    name: 'DiRT Rally 2.0',
    label: 'DiRT Rally 2.0',
    emoji: '<:DR20:1538227326691573901>',
    color: 0x95a5a6,
  },
];

export function buildRoleSelectorRows(): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>();
  const row2 = new ActionRowBuilder<ButtonBuilder>();

  GAME_ROLES_LIST.slice(0, 5).forEach((game) => {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`role_game_toggle_${game.id}`)
        .setLabel(game.label)
        .setEmoji(game.emoji)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  GAME_ROLES_LIST.slice(5).forEach((game) => {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`role_game_toggle_${game.id}`)
        .setLabel(game.label)
        .setEmoji(game.emoji)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return [row1, row2];
}

export const panelRolesCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('panel-roles')
    .setDescription('Publica el panel oficial para que los miembros elijan sus juegos y reciban roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal de Discord donde enviar el panel de roles (por defecto este canal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('mencion')
        .setDescription('Mención inicial para notificar a los miembros')
        .setRequired(false)
        .addChoices(
          { name: '@everyone', value: 'everyone' },
          { name: '@here', value: 'here' },
          { name: 'Sin mención', value: 'ninguna' }
        )
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
        content: '❌ Solo los administradores o moderadores pueden ejecutar este comando.',
        ephemeral: true,
      });
      return;
    }

    const targetChannel =
      (interaction.options.getChannel('canal') as TextChannel | null) ||
      (interaction.channel as TextChannel | null);

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.reply({
        content: '❌ Canal no válido.',
        ephemeral: true,
      });
      return;
    }

    const mencionOption = interaction.options.getString('mencion') ?? 'everyone';
    let mentionText = '';
    if (mencionOption === 'everyone') {
      mentionText = '@everyone\n';
    } else if (mencionOption === 'here') {
      mentionText = '@here\n';
    }

    const embed = new EmbedBuilder()
      .setTitle('Selección de Juegos y Simuladores • LATAM SimRacing Alliance')
      .setColor(0x23b6e0)
      .setDescription(
        `¡Bienvenido a **LATAM SimRacing Alliance**!\n\n` +
          `Haz clic en los botones de abajo para elegir los simuladores y juegos a los que compites. ` +
          `Al seleccionar un juego se te asignará el rol correspondiente de forma automática para acceder a sus categorías, enterarte de torneos, avisos y eventos de pista.\n\n` +
          `**Simuladores disponibles:**\n` +
          `• <:AC:1538221321391968276> **Assetto Corsa**\n` +
          `• <:ACC:1538222193995944099> **Assetto Corsa Competizione**\n` +
          `• <:ACEVO:1538222336292028488> **Assetto Corsa EVO**\n` +
          `• <:iracing_logo:1538223744571408384> **iRacing**\n` +
          `• <:LeMansUltimateLogo:1538224347691491428> **Le Mans Ultimate**\n` +
          `• <:F1logo:1538222743881916486> **F1**\n` +
          `• <:WRC:1538223219142828092> **EA Sports WRC**\n` +
          `• <:ACRally:1538224420986814536> **Assetto Corsa Rally**\n` +
          `• <:DR20:1538227326691573901> **DiRT Rally 2.0**\n\n` +
          `*Puedes volver a hacer clic en cualquier botón en cualquier momento para quitarte el rol si ya no lo juegas.*`
      )
      .setFooter({
        text: 'LATAM SimRacing Alliance • Roles de Comunidad',
      })
      .setTimestamp(new Date());

    const rows = buildRoleSelectorRows();

    try {
      await targetChannel.send({
        content: mentionText ? mentionText.trim() : undefined,
        embeds: [embed],
        components: rows,
      });

      await interaction.reply({
        content: `✅ Panel de selección de roles publicado con éxito en <#${targetChannel.id}>.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error publicando panel de roles:', err);
      await interaction.reply({
        content: '❌ Ocurrió un error al publicar el panel de roles en el canal especificado.',
        ephemeral: true,
      });
    }
  },
};
