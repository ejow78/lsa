import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';

export const entrylistCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('entrylist')
    .setDescription(
      'Muestra el Entry List del servidor: autos asignados por piloto y autos libres para entrar'
    )
    .addBooleanOption((option) =>
      option
        .setName('publico')
        .setDescription(
          'Si es true, el mensaje será visible para todo el canal (por defecto: solo para ti)'
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const isPublic = interaction.options.getBoolean('publico') ?? false;
    await interaction.deferReply({ ephemeral: !isPublic });

    const entryList = await emperorService.getEntryList();
    const buttonJoinUrl = emperorService.getContentManagerJoinButtonUrl();
    const liveTimingWebUrl = emperorService.getLiveTimingWebUrl();

    if (!entryList.online) {
      await interaction.editReply({
        content: '🔴 El servidor no responde en este momento. Intenta nuevamente en unos segundos.',
      });
      return;
    }

    // Agrupar autos asignados por piloto para que se lea más limpio y ordenado
    const driversMap = new Map<
      string,
      { nation: string; isConnected: boolean; cars: string[] }
    >();

    for (const slot of entryList.assignedSlots) {
      const existing = driversMap.get(slot.driverName);
      const slotDesc = `\`#${String(slot.slotNumber).padStart(2, '0')}\` ${slot.carModel}`;
      if (existing) {
        existing.cars.push(slotDesc);
        if (slot.isConnected) existing.isConnected = true;
      } else {
        driversMap.set(slot.driverName, {
          nation: slot.driverNation,
          isConnected: slot.isConnected,
          cars: [slotDesc],
        });
      }
    }

    const assignedLines: string[] = [];
    for (const [driverName, info] of driversMap.entries()) {
      const statusDot = info.isConnected ? '🟢' : '⚪';
      const flag = emperorService.formatNationFlag(info.nation);
      const flagBadge = flag ? ` ${flag}` : '';
      assignedLines.push(
        `${statusDot}${flagBadge} **${driverName}**\n└ ${info.cars.join(' • ')}`
      );
    }

    const freeLines = entryList.freeSlots.map(
      (slot) =>
        `🔓 \`Slot #${String(slot.slotNumber).padStart(2, '0')}\` — **${slot.carModel}**${slot.skin ? ` *(${slot.skin})*` : ''}`
    );

    const embed = new EmbedBuilder()
      .setTitle(`📋 Entry List — ${entryList.serverName}`)
      .setURL(liveTimingWebUrl)
      .setDescription(
        `📍 **Circuito:** ${entryList.trackName}\n` +
          `🏎️ **Slots Totales:** ${entryList.totalSlots} (${entryList.assignedSlots.length} asignados • **${entryList.freeSlots.length} libres**)`
      )
      .setColor(entryList.freeSlots.length > 0 ? 0x3498db : 0xe67e22)
      .addFields(
        {
          name: `👤 Autos Asignados a Pilotos (${entryList.assignedSlots.length} slots)`,
          value:
            assignedLines.length > 0
              ? assignedLines.join('\n').slice(0, 1024)
              : '*No hay autos reservados con nombre.*',
          inline: false,
        },
        {
          name: `🔓 Autos Libres para Entrar (${entryList.freeSlots.length} slots)`,
          value:
            freeLines.length > 0
              ? freeLines.join('\n').slice(0, 1024)
              : '*Todos los slots tienen piloto asignado en este momento.*',
          inline: false,
        }
      )
      .setTimestamp(entryList.updatedAt)
      .setFooter({ text: '🟢 En pista ahora • ⚪ Reservado en Entry List' });

    if (entryList.trackPreviewUrl) {
      embed.setThumbnail(entryList.trackPreviewUrl);
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Entrar a Pista')
        .setStyle(ButtonStyle.Link)
        .setURL(buttonJoinUrl)
        .setEmoji('🏎️'),
      new ButtonBuilder()
        .setLabel('Live Timing Web')
        .setStyle(ButtonStyle.Link)
        .setURL(liveTimingWebUrl)
        .setEmoji('📊')
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
