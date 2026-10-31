import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';

export function buildRulesEmbed(guildName: string = 'LATAM SimRacing Alliance'): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('📋 Reglamento Oficial y Código de Conducta • ' + guildName)
    .setColor(0xe74c3c)
    .setDescription(
      `¡Bienvenido a **${guildName}**! Para garantizar una comunidad sana, organizada y un ambiente de carreras limpio, todos los miembros deben leer y respetar las siguientes normas:\n\n` +
      `### 1️⃣ Convivencia y Respeto\n` +
      `• **Respeto mutuo:** Queda estrictamente prohibido cualquier tipo de insulto, acoso, discriminación o toxicidad. La competitividad es bienvenida; los ataques personales, no.\n` +
      `• **Uso correcto del chat:** Mantén la conversación en los canales adecuados. Evita el spam y el uso innecesario de menciones masivas.\n\n` +
      `### 2️⃣ Código de Conducta en Pista (Fair Play)\n` +
      `• **Conducción limpia:** El simracing exige paciencia. Evita tiradas de coche desesperadas o contactos innecesarios, especialmente en la primera curva.\n` +
      `• **Cero "Rage Quit" destructivo:** Si sufres un toque o accidente, mantén la calma. Las discusiones no se realizan en caliente ni en los canales públicos.\n` +
      `• **Comisaría y Reclamos:** Cualquier incidente en carreras oficiales se debe resolver internamente y sin involucrar pilotos ajenos al suceso.\n` +
      `• **Conexión a internet:** Asegúrate de tener una conexión estable. Si experimentas lag severo o teletransportaciones, mantén un margen de seguridad razonable con otros coches.\n\n` +
      `### 3️⃣ Canales, Contenido y Roles\n` +
      `• **Selección de juegos:** Pásate por <#${env.rolesChannelId}> para marcar los títulos que juegas (AC, ACC, AC Evo, Rally, F1, WRC) y saber dónde te especializas.\n` +
      `• **Foros de Mods y Contenido:** Si quieres ingresar a los servidores de Assetto Corsa, tienes que descargar los contenidos que están en los canales de mods (<#1529974353595334796>, <#1562226934803337216>, <#1532932994141130892>).\n\n` +
      `───────────────────────────────\n` +
      `### ✅ Aceptación del Reglamento y Acceso\n` +
      `Para confirmar que has leído y aceptado este reglamento, presiona el botón verde **Aceptar Reglamento** de abajo (o reacciona con el emoji ✅).\n\n` +
      `Al hacerlo, recibirás automáticamente el rol de <@&${env.pilotRoleId}> y se habilitará el acceso completo a la comunidad.`
    )
    .setFooter({
      text: 'LATAM SimRacing Alliance • Fair Play & SimRacing Community',
    })
    .setTimestamp();
}

export function buildRulesActionRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('accept_rules_and_verify')
      .setLabel('Aceptar Reglamento')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );
}

export async function sendRulesPanelToChannel(channel: TextChannel, guildName?: string) {
  const embed = buildRulesEmbed(guildName);
  const row = buildRulesActionRow();

  const message = await channel.send({
    embeds: [embed],
    components: [row],
  });

  // Reaccionar con el tick verde automáticamente
  await message.react('✅').catch(() => null);

  return message;
}

export const panelReglasCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('panel-reglas')
    .setDescription('Publica el reglamento oficial con el botón interactivo para auto-asignar el rol de Piloto.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal donde publicar el reglamento (por defecto el canal de reglas oficial o el actual)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember | null;
    const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);
    const hasModRole =
      member?.roles instanceof GuildMemberRoleManager
        ? member.roles.cache.has(env.MOD_ROLE_ID)
        : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);

    if (!isAdmin && !hasModRole) {
      await interaction.reply({
        content: '❌ Solo los administradores o moderadores pueden publicar el panel de reglas.',
        ephemeral: true,
      });
      return;
    }

    let targetChannel = interaction.options.getChannel('canal') as TextChannel | null;

    if (!targetChannel) {
      // Si no se especifica canal, intentar buscar el canal configurado de reglas
      const configuredRulesChannel = (await interaction.guild?.channels
        .fetch(env.rulesChannelId)
        .catch(() => null)) as TextChannel | null;

      targetChannel = configuredRulesChannel || (interaction.channel as TextChannel);
    }

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.reply({
        content: '❌ No se pudo encontrar un canal de texto válido para publicar el reglamento.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await sendRulesPanelToChannel(targetChannel, interaction.guild?.name);

      await interaction.editReply({
        content: `✅ Panel de reglamento publicado con éxito en <#${targetChannel.id}> con botón interactivo y reacción ✅.`,
      });
    } catch (error) {
      console.error('❌ Error al publicar panel de reglas:', error);
      await interaction.editReply({
        content: '❌ Ocurrió un error al intentar publicar el panel de reglas en el canal.',
      });
    }
  },
};
