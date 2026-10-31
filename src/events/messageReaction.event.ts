import {
  Events,
  GuildMember,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
  type Client,
} from 'discord.js';
import { env } from '../config/env.js';

export function registerReactionEvents(client: Client): void {
  // Cuando un usuario reacciona con ✅ al reglamento
  client.on(
    Events.MessageReactionAdd,
    async (
      reaction: MessageReaction | PartialMessageReaction,
      user: User | PartialUser
    ) => {
      try {
        if (user.bot) return;

        if (reaction.partial) {
          try {
            await reaction.fetch();
          } catch (e) {
            return;
          }
        }

        // Solo procesamos el emoji de tick verde
        if (reaction.emoji.name !== '✅') return;

        // Comprobar que sea en el canal de reglas
        const channelId = reaction.message.channelId;
        if (channelId !== env.rulesChannelId) {
          // También permitir si el mensaje tiene el título de reglamento
          const isRulesMessage = reaction.message.embeds.some((embed) =>
            embed.title?.toLowerCase().includes('reglamento oficial')
          );
          if (!isRulesMessage) return;
        }

        const guild = reaction.message.guild;
        if (!guild) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        const role =
          guild.roles.cache.get(env.pilotRoleId) ||
          guild.roles.cache.find(
            (r) => r.name.toLowerCase() === 'piloto' || r.name.toLowerCase() === 'pilotos'
          );

        if (!role) return;

        if (!member.roles.cache.has(role.id)) {
          await member.roles.add(role, 'Reacción con tick verde al reglamento');
          console.log(`✅ Rol ${role.name} asignado a ${member.user.tag} por reacción`);
        }
      } catch (err) {
        console.error('Error en MessageReactionAdd:', err);
      }
    }
  );

  // Cuando un usuario retira su reacción ✅
  client.on(
    Events.MessageReactionRemove,
    async (
      reaction: MessageReaction | PartialMessageReaction,
      user: User | PartialUser
    ) => {
      try {
        if (user.bot) return;

        if (reaction.partial) {
          try {
            await reaction.fetch();
          } catch (e) {
            return;
          }
        }

        if (reaction.emoji.name !== '✅') return;

        const channelId = reaction.message.channelId;
        if (channelId !== env.rulesChannelId) {
          const isRulesMessage = reaction.message.embeds.some((embed) =>
            embed.title?.toLowerCase().includes('reglamento oficial')
          );
          if (!isRulesMessage) return;
        }

        const guild = reaction.message.guild;
        if (!guild) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        const role =
          guild.roles.cache.get(env.pilotRoleId) ||
          guild.roles.cache.find(
            (r) => r.name.toLowerCase() === 'piloto' || r.name.toLowerCase() === 'pilotos'
          );

        if (!role) return;

        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'Retiro de reacción al reglamento');
          console.log(`❌ Rol ${role.name} retirado a ${member.user.tag} por quitar reacción`);
        }
      } catch (err) {
        console.error('Error en MessageReactionRemove:', err);
      }
    }
  );
}
