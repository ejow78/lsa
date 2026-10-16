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

    // Registrar Slash Commands automáticamente en el Guild configurado
    try {
      const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
      const body = commandsList.map((cmd) => cmd.data.toJSON());

      await rest.put(
        Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
        { body }
      );

      console.log(
        `⚡ ${body.length} Slash Commands registrados en el servidor (${env.GUILD_ID}): /servidor, /link`
      );
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
