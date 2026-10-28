import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';

export const campeonatoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('campeonato')
    .setDescription(
      'Muestra los campeonatos activos, calendario de fechas, puntajes e inscripciones'
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

    const championships = await emperorService.getChampionships();
    const championshipsWebUrl = emperorService.getChampionshipsWebUrl();

    if (championships.length === 0) {
      await interaction.editReply({
        content: `No se encontraron campeonatos activos en este momento. Puedes revisarlos en: ${championshipsWebUrl}`,
      });
      return;
    }

    const embeds: EmbedBuilder[] = [];
    const buttons: ButtonBuilder[] = [];

    for (const champ of championships.slice(0, 3)) {
      const classesText = champ.classes
        .map((cls) => {
          const pts =
            cls.pointsTopPlaces.length > 0
              ? `Puntos Top 5: \`${cls.pointsTopPlaces.join('-')}\``
              : '';
          const extras: string[] = [];
          if (cls.polePoints > 0) extras.push(`Pole Position: +${cls.polePoints}`);
          if (cls.bestLapPoints > 0) extras.push(`Vuelta Rápida: +${cls.bestLapPoints}`);
          const extrasStr = extras.length > 0 ? ` (${extras.join(', ')})` : '';
          const driversCount = cls.registeredDrivers.length;

          return `• **${cls.name}** — ${driversCount}/${cls.totalSlots} inscriptos ${pts}${extrasStr}`;
        })
        .join('\n');

      const calendarText =
        champ.events.length > 0
          ? champ.events
              .slice(0, 8)
              .map((ev) => {
                const statusLabel = ev.completed ? '[Completada]' : '[Pendiente]';
                const layoutStr = ev.trackLayout ? ` (${ev.trackLayout})` : '';
                return `• **Fecha ${ev.index}:** ${ev.trackName}${layoutStr} — *${statusLabel}*`;
              })
              .join('\n')
          : '*Sin fechas cargadas todavía.*';

      const allDrivers = champ.classes.flatMap((c) =>
        c.registeredDrivers.map((d) => `• **${d.name}** — *${d.carModel}*`)
      );

      const registrationMode = champ.openEntrants
        ? 'Grilla Abierta (Entrada libre)'
        : champ.signUpEnabled
          ? 'Inscripción por Formulario Web'
          : 'Lista Cerrada';

      const embed = new EmbedBuilder()
        .setTitle(champ.name)
        .setURL(champ.url)
        .setDescription(
          `**Modalidad:** ${registrationMode}\n` +
            `**Progreso:** ${champ.progressPercent}% (${champ.numEvents} fechas • ${champ.numEntrants} cupos)`
        )
        .setColor(0xf1c40f)
        .addFields(
          {
            name: 'Clases y Sistema de Puntaje',
            value: classesText || 'Clase única',
            inline: false,
          },
          {
            name: `Calendario de Fechas (${champ.events.length})`,
            value: calendarText,
            inline: false,
          }
        )
        .setTimestamp(new Date())
        .setFooter({ text: 'LATAM SimRacing Alliance • Campeonatos' });

      if (allDrivers.length > 0) {
        embed.addFields({
          name: `Pilotos Inscriptos (${allDrivers.length})`,
          value: allDrivers.slice(0, 15).join('\n'),
          inline: false,
        });
      }

      embeds.push(embed);

      buttons.push(
        new ButtonBuilder()
          .setLabel(
            champ.name.length > 35
              ? `${champ.name.slice(0, 32)}...`
              : champ.name
          )
          .setStyle(ButtonStyle.Link)
          .setURL(champ.url)
      );
    }

    buttons.push(
      new ButtonBuilder()
        .setLabel('Ver Todos los Campeonatos')
        .setStyle(ButtonStyle.Link)
        .setURL(championshipsWebUrl)
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.slice(0, 5)
    );

    await interaction.editReply({
      embeds,
      components: [row],
    });
  },
};
