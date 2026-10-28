import { Events, REST, Routes, type Client } from 'discord.js';
import { env } from '../config/env.js';
import { commandsList } from '../commands/index.js';
import { MonitorService } from '../services/monitor.service.js';

export function registerReadyEvent(client: Client): {
  getMonitorService: () => MonitorService | null;
} {
  let monitorService: MonitorService | null = null;

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Bot conectado como ${readyClient.user.tag}`);

    // Registrar Slash Commands en todos los servidores donde esté el bot + globalmente
    try {
      const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
      const body = commandsList.map((cmd) => cmd.data.toJSON());

      // 1. Registrar instantáneamente en cada servidor donde esté presente el bot
      for (const [guildId, guild] of readyClient.guilds.cache) {
        try {
          await rest.put(
            Routes.applicationGuildCommands(env.CLIENT_ID, guildId),
            { body }
          );
          console.log(`⚡ ${body.length} Slash Commands registrados en servidor: ${guild.name} (${guildId})`);
        } catch (guildErr) {
          console.warn(`⚠️ No se pudieron registrar comandos en servidor ${guildId}:`, guildErr);
        }
      }

      // 2. Registrar globalmente para futuros servidores
      await rest.put(
        Routes.applicationCommands(env.CLIENT_ID),
        { body }
      );

      const commandNames = commandsList.map((cmd) => `/${cmd.data.name}`).join(', ');
      console.log(`⚡ Comandos listos en Discord: ${commandNames}`);
    } catch (error) {
      console.error('❌ Error al registrar los Slash Commands:', error);
    }

    // Iniciar el Monitor en Vivo
    monitorService = new MonitorService(readyClient);
    await monitorService.start();
  });

  return {
    getMonitorService: () => monitorService,
  };
}
