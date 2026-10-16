import { Events, type Client } from 'discord.js';
import { commandsCollection } from '../commands/index.js';

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandsCollection.get(interaction.commandName);
    if (!command) {
      console.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `❌ Error ejecutando el comando /${interaction.commandName}:`,
        error
      );

      const errorPayload = {
        content: '❌ Ocurrió un error al procesar este comando. Intenta de nuevo en unos segundos.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorPayload).catch(() => null);
      } else {
        await interaction.reply(errorPayload).catch(() => null);
      }
    }
  });
}
