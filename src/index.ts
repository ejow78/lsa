import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { registerReadyEvent } from './events/ready.event.js';
import { registerInteractionCreateEvent } from './events/interactionCreate.event.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const { getMonitorService } = registerReadyEvent(client);
registerInteractionCreateEvent(client);

const shutdown = (signal: string) => {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando el bot...`);
  getMonitorService()?.stop();
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

client.login(env.DISCORD_TOKEN).catch((error) => {
  console.error('❌ Error al iniciar sesión en Discord (verifica tu DISCORD_TOKEN):', error);
  process.exit(1);
});
