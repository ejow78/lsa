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

export const panelReportesCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('panel-reportes')
    .setDescription('Publica el panel interactivo oficial para recibir denuncias de incidentes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('juego')
        .setDescription('Simulador para el panel de denuncias')
        .setRequired(true)
        .addChoices(
          { name: 'Assetto Corsa (AC)', value: 'AC' },
          { name: 'Assetto Corsa Competizione (ACC)', value: 'ACC' }
        )
    )
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal donde publicar el panel (por defecto el canal oficial configurado)')
        .addChannelTypes(ChannelType.GuildText)
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
        content: '❌ Solo los administradores o moderadores pueden ejecutar este comando.',
        ephemeral: true,
      });
      return;
    }

    const juego = interaction.options.getString('juego', true) as 'AC' | 'ACC';
    const defaultChannelId = juego === 'ACC' ? env.accReportChannelId : env.acReportChannelId;
    const targetChannel =
      (interaction.options.getChannel('canal') as TextChannel | null) ||
      (await interaction.client.channels.fetch(defaultChannelId).catch(() => null) as TextChannel | null) ||
      (interaction.channel as TextChannel | null);

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.reply({
        content: '❌ No se pudo encontrar el canal para publicar el panel.',
        ephemeral: true,
      });
      return;
    }

    const isACC = juego === 'ACC';
    const gameFullName = isACC ? 'Assetto Corsa Competizione' : 'Assetto Corsa';
    const colorCode = isACC ? 0xe67e22 : 0xe74c3c;
    const buttonId = isACC ? 'open_report_modal_ACC' : 'open_report_modal_AC';

    const embed = new EmbedBuilder()
      .setTitle(`Comisariato Deportivo • ${gameFullName}`)
      .setColor(colorCode)
      .setDescription(
        `Bienvenido al sistema oficial de reportes y denuncias de **LATAM SimRacing Alliance**.\n\n` +
          `Si estuviste involucrado en una maniobra antideportiva, colisión o incidente que consideres punible, presiona el botón inferior para abrir el formulario oficial de comisariato.\n\n` +
          `**Datos a completar en el reporte:**\n` +
          `1. **Tu Nombre de Piloto:** Tu nombre en pista.\n` +
          `2. **Piloto o Auto Denunciado:** Nombre del rival o auto/número.\n` +
          `3. **Momento Exacto:** Sesión, número de vuelta o minuto de carrera.\n` +
          `4. **Descripción:** Explica con claridad lo ocurrido.\n\n` +
          `*Los comisarios evaluarán la telemetría y los registros de repetición del servidor.*`
      )
      .setFooter({
        text: 'LATAM SimRacing Alliance • Colegio de Comisarios Deportivos',
      })
      .setTimestamp(new Date());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buttonId)
        .setLabel(`Enviar Denuncia (${juego})`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚨')
    );

    try {
      await targetChannel.send({
        embeds: [embed],
        components: [row],
      });

      await interaction.reply({
        content: `✅ Panel de reportes de **${gameFullName}** publicado con éxito en <#${targetChannel.id}>.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error publicando panel de reportes:', err);
      await interaction.reply({
        content: '❌ Error al publicar el panel en el canal de destino.',
        ephemeral: true,
      });
    }
  },
};
