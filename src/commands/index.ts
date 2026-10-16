import { Collection } from 'discord.js';
import type { SlashCommand } from './types.js';
import { servidorCommand } from './servidor.command.js';
import { linkCommand } from './link.command.js';
import { entrylistCommand } from './entrylist.command.js';
import { campeonatoCommand } from './campeonato.command.js';

export const commandsList: SlashCommand[] = [
  servidorCommand,
  linkCommand,
  entrylistCommand,
  campeonatoCommand,
];

export const commandsCollection = new Collection<string, SlashCommand>();
for (const cmd of commandsList) {
  commandsCollection.set(cmd.data.name, cmd);
}
