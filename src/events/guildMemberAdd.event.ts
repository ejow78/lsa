import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  GuildMember,
  TextChannel,
  type Client,
} from 'discord.js';
import { env } from '../config/env.js';

export function registerGuildMemberAddEvent(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    try {
      const channelId = env.welcomeChannelId;
      if (!channelId) return;

      const channel = (await member.guild.channels
        .fetch(channelId)
        .catch(() => null)) as TextChannel | null;

      if (!channel || !channel.isTextBased()) {
        console.warn(`⚠️ Canal de bienvenida (${channelId}) no encontrado o sin permisos.`);
        return;
      }

      const memberCount = member.guild.memberCount;
      const avatarUrl = member.user.displayAvatarURL({ size: 256 });
      const serverIconUrl = member.guild.iconURL({ size: 256 }) || undefined;

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🏁 ¡Bienvenido/a a LATAM SimRacing Alliance! 🏎️')
        .setColor(0xe74c3c)
        .setDescription(
          `¡Hola ${member}! Te damos una cálida bienvenida a la comunidad oficial de SimRacing de **LATAM**.\n\n` +
          `Para disfrutar al máximo y participar en nuestras salas y campeonatos, sigue estos pasos:\n\n` +
          `1️⃣ **Reglamento y Rol de Piloto:**\n` +
          `Pásate por <#${env.rulesChannelId}> y presiona el botón verde **✅ Aceptar Reglamento** para recibir tu rol de <@&${env.pilotRoleId}> y desbloquear el servidor.\n\n` +
          `2️⃣ **Elige tus Simuladores:**\n` +
          `Marca a qué juegos corres (AC, ACC, AC Evo, iRacing, F1, WRC, Rally...) en <#${env.rolesChannelId}> para recibir noticias y menciones de tus categorías.\n\n` +
          `3️⃣ **Preséntate a la comunidad:**\n` +
          `Déjanos saber de dónde eres y qué simuladores te apasionan en <#${env.presentationChannelId}>.\n\n` +
          `*¡Que disfrutes de las carreras y nos vemos en la pista!*`
        )
        .setThumbnail(avatarUrl)
        .setFooter({
          text: `Piloto #${memberCount} • LATAM SimRacing Alliance`,
          iconURL: serverIconUrl,
        })
        .setTimestamp();

      const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('📋 Ver Reglamento')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${member.guild.id}/${env.rulesChannelId}`),
        new ButtonBuilder()
          .setLabel('🎮 Escoger Juegos')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${member.guild.id}/${env.rolesChannelId}`)
      );

      await channel.send({
        content: `👋 ¡Bienvenido/a ${member} a **LATAM SimRacing Alliance**!`,
        embeds: [welcomeEmbed],
        components: [navRow],
      });
    } catch (error) {
      console.error(`❌ Error al procesar bienvenida para ${member.user.tag}:`, error);
    }
  });
}
