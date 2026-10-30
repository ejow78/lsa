import {
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

export const anuncioCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('Publica un comunicado o mensaje a través del bot (Solo Administradores)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('mensaje')
        .setDescription('Contenido del anuncio o mensaje')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal de Discord donde se enviará (por defecto este canal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('titulo')
        .setDescription('Título opcional del comunicado (lo envía con formato Embed oficial)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('formato')
        .setDescription('Estilo del mensaje: Embed corporativo LSA o texto plano simple')
        .setRequired(false)
        .addChoices(
          { name: 'Embed Oficial LSA', value: 'embed' },
          { name: 'Texto Plano Directo', value: 'texto' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('mencion')
        .setDescription('Mención especial para notificar a los miembros')
        .setRequired(false)
        .addChoices(
          { name: 'Sin mención', value: 'ninguna' },
          { name: '@everyone', value: 'everyone' },
          { name: '@here', value: 'here' },
          { name: 'Rol Alertas LSA', value: 'alertas' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('color')
        .setDescription('Color del embed (si se usa formato Embed)')
        .setRequired(false)
        .addChoices(
          { name: 'Azul Oficial LSA (#23B6E0)', value: 'azul' },
          { name: 'Rojo Alerta (#E74C3C)', value: 'rojo' },
          { name: 'Verde Éxito (#2ECC71)', value: 'verde' },
          { name: 'Dorado / Amarillo (#F1C40F)', value: 'dorado' }
        )
    ),

  async execute(interaction) {
    // Verificación estricta de permisos de Administrador o Moderador
    const member = interaction.member as GuildMember | null;
    const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);
    const hasModRole =
      member?.roles instanceof GuildMemberRoleManager
        ? member.roles.cache.has(env.MOD_ROLE_ID)
        : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);

    if (!isAdmin && !hasModRole) {
      await interaction.reply({
        content: '❌ Solo los administradores y miembros del staff pueden utilizar este comando.',
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
        content: '❌ No se pudo encontrar el canal especificado o no es un canal de texto.',
        ephemeral: true,
      });
      return;
    }

    const titulo = interaction.options.getString('titulo');
    const formatoOption = interaction.options.getString('formato');
    const isEmbed = formatoOption === 'embed' || (!formatoOption && Boolean(titulo));
    const mencionOption = interaction.options.getString('mencion') || 'ninguna';
    const colorOption = interaction.options.getString('color') || 'azul';

    let mentionPrefix = '';
    if (mencionOption === 'everyone') {
      mentionPrefix = '@everyone\n';
    } else if (mencionOption === 'here') {
      mentionPrefix = '@here\n';
    } else if (mencionOption === 'alertas' && env.ALERT_ROLE_ID) {
      mentionPrefix = `<@&${env.ALERT_ROLE_ID}>\n`;
    }

    try {
      if (isEmbed) {
        let colorCode = 0x23b6e0;
        if (colorOption === 'rojo') colorCode = 0xe74c3c;
        if (colorOption === 'verde') colorCode = 0x2ecc71;
        if (colorOption === 'dorado') colorCode = 0xf1c40f;

        const embed = new EmbedBuilder()
          .setTitle(titulo || 'Comunicado Oficial — LATAM SimRacing Alliance')
          .setDescription(mensaje)
          .setColor(colorCode)
          .setTimestamp(new Date())
          .setFooter({
            text: 'LATAM SimRacing Alliance • Comunicación Oficial',
          });

        await targetChannel.send({
          content: mentionPrefix ? mentionPrefix.trim() : undefined,
          embeds: [embed],
        });
      } else {
        await targetChannel.send({
          content: `${mentionPrefix}${mensaje}`,
        });
      }

      await interaction.reply({
        content: `✅ Mensaje publicado con éxito en <#${targetChannel.id}>.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error publicando anuncio con el bot:', err);
      await interaction.reply({
        content: '❌ Hubo un error al intentar enviar el mensaje al canal.',
        ephemeral: true,
      });
    }
  },
};
