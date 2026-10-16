import { Collection } from 'discord.js';
import type { SlashCommand } from './types.js';
import { servidorCommand } from './servidor.command.js';
import { linkCommand } from './link.command.js';

export const commandsList: SlashCommand[] = [servidorCommand, linkCommand];

export const commandsCollection = new Collection<string, SlashCommand>();
for (const cmd of commandsList) {
  commandsCollection.set(cmd.data.name, cmd);
}
