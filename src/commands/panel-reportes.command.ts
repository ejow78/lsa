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

export async function sendReportPanelToChannel(
  channel: TextChannel,
  juego: 'AC' | 'ACC'
): Promise<void> {
  const isACC = juego === 'ACC';
  const gameFullName = isACC ? 'Assetto Corsa Competizione' : 'Assetto Corsa';
  const colorCode = isACC ? 0xe67e22 : 0xe74c3c;
  const buttonId = isACC ? 'open_report_modal_ACC' : 'open_report_modal_AC';

  const embed = new EmbedBuilder()
    .setTitle(`Reportes de Incidentes • ${gameFullName}`)
    .setColor(colorCode)
    .setDescription(
      `Bienvenido al sistema oficial de reportes y denuncias de **LATAM SimRacing Alliance**.\n\n` +
        `Si estuviste involucrado en una maniobra antideportiva, colisión o incidente que consideres punible, presiona el botón inferior para abrir el formulario oficial.\n\n` +
        `**Datos a completar en el reporte:**\n` +
        `1. **Tu Nombre de Piloto:** Tu nombre en pista.\n` +
        `2. **Piloto o Auto Denunciado:** Nombre del rival o auto/número.\n` +
        `3. **Momento Exacto:** Sesión, número de vuelta o minuto de carrera.\n` +
        `4. **Descripción:** Explica con claridad lo ocurrido.\n\n` +
        `*El staff evaluará la telemetría y los registros de repetición del servidor.*`
    )
    .setFooter({
      text: 'LATAM SimRacing Alliance',
    })
    .setTimestamp(new Date());

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buttonId)
      .setLabel(`Enviar Denuncia (${juego})`)
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🚨')
  );

  await channel.send({
    embeds: [embed],
    components: [row],
  });
}

export const panelReportesCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('panel-reportes')
    .setDescription('Publica el panel interactivo oficial para recibir denuncias de incidentes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('juego')
        .setDescription('Simulador para el panel de denuncias (opcional: si no lo eliges, te preguntará)')
        .setRequired(false)
        .addChoices(
          { name: 'Assetto Corsa (AC)', value: 'AC' },
          { name: 'Assetto Corsa Competizione (ACC)', value: 'ACC' },
          { name: 'Ambos Canales (AC y ACC)', value: 'BOTH' }
        )
    )
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal donde publicar el panel (por defecto los canales oficiales configurados)')
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

    const juegoParam = interaction.options.getString('juego') as 'AC' | 'ACC' | 'BOTH' | null;

    // Si no especificó el juego, le preguntamos con botones interactivos
    if (!juegoParam) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('publish_panel_action_AC')
          .setLabel('Publicar Panel de Assetto Corsa')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏎️'),
        new ButtonBuilder()
          .setCustomId('publish_panel_action_ACC')
          .setLabel('Publicar Panel de ACC')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🏁'),
        new ButtonBuilder()
          .setCustomId('publish_panel_action_BOTH')
          .setLabel('Publicar en Ambos Canales')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🚀')
      );

      await interaction.reply({
        content:
          `📋 **Publicador de Paneles Oficiales de Comisariato**\n\n` +
          `¿Para qué simulador deseas publicar el panel de reportes?\n` +
          `• **Assetto Corsa:** Se publicará en <#${env.acReportChannelId}>\n` +
          `• **ACC:** Se publicará en <#${env.accReportChannelId}>`,
        components: [row],
        ephemeral: true,
      });
      return;
    }

    // Si especificó el juego
    const specifiedChannel = interaction.options.getChannel('canal') as TextChannel | null;

    if (juegoParam === 'BOTH') {
      const acCh = (await interaction.client.channels.fetch(env.acReportChannelId).catch(() => null)) as TextChannel | null;
      const accCh = (await interaction.client.channels.fetch(env.accReportChannelId).catch(() => null)) as TextChannel | null;

      if (acCh && acCh.isTextBased()) await sendReportPanelToChannel(acCh, 'AC');
      if (accCh && accCh.isTextBased()) await sendReportPanelToChannel(accCh, 'ACC');

      await interaction.reply({
        content: `✅ Paneles publicados en <#${env.acReportChannelId}> (AC) y en <#${env.accReportChannelId}> (ACC).`,
        ephemeral: true,
      });
      return;
    }

    const defaultChannelId = juegoParam === 'ACC' ? env.accReportChannelId : env.acReportChannelId;
    const targetChannel =
      specifiedChannel ||
      ((await interaction.client.channels.fetch(defaultChannelId).catch(() => null)) as TextChannel | null) ||
      (interaction.channel as TextChannel | null);

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.reply({
        content: '❌ No se pudo encontrar el canal para publicar el panel.',
        ephemeral: true,
      });
      return;
    }

    await sendReportPanelToChannel(targetChannel, juegoParam);
    await interaction.reply({
      content: `✅ Panel de reportes para **${juegoParam === 'ACC' ? 'ACC' : 'Assetto Corsa'}** publicado en <#${targetChannel.id}>.`,
      ephemeral: true,
    });
  },
};
