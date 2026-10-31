import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env.js';
import { registerReadyEvent } from './events/ready.event.js';
import { registerInteractionCreateEvent } from './events/interactionCreate.event.js';
import { registerGuildMemberAddEvent } from './events/guildMemberAdd.event.js';
import { registerReactionEvents } from './events/messageReaction.event.js';
import { startWebServer } from './web/server.js';
import { liveTimingService } from './services/livetiming.service.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
});

const { getMonitorService } = registerReadyEvent(client);
registerInteractionCreateEvent(client);
registerGuildMemberAddEvent(client);
registerReactionEvents(client);

const webServer = startWebServer(client);

const shutdown = (signal: string) => {
  console.log(`\nRecibida señal ${signal}. Cerrando el bot y servidor web...`);
  getMonitorService()?.stop();
  liveTimingService.stop();
  webServer.close();
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

client.login(env.DISCORD_TOKEN).catch((error) => {
  console.error('Error al iniciar sesión en Discord (verifica tu DISCORD_TOKEN):', error);
  process.exit(1);
});
