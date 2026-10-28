import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { emperorService } from '../services/emperor.service.js';
import { generateDriverLicenseCard } from '../services/license-card.service.js';

export const licenciaCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('licencia')
    .setDescription('Genera tu Superlicencia Oficial de Sim Racing en imagen gráfica con tus estadísticas')
    .addStringOption((opt) =>
      opt
        .setName('nombre')
        .setDescription('Nombre del piloto en Assetto Corsa (o déjalo vacío para buscar por tu usuario)')
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName('publico')
        .setDescription('¿Publicar la tarjeta en el canal para que todos la vean? (por defecto: Sí)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const isPublic = interaction.options.getBoolean('publico') ?? true;
    await interaction.deferReply({ ephemeral: !isPublic });

    const queryName =
      interaction.options.getString('nombre') ||
      interaction.user.displayName ||
      interaction.user.username;

    const profile = await emperorService.getDriverProfile(queryName);

    if (!profile) {
      await interaction.editReply({
        content: '⚠️ No hay datos de sesiones ni pilotos registrados todavía en el servidor.',
      });
      return;
    }

    if (!profile.found) {
      const list = profile.availableDrivers.slice(0, 8).map((d) => `• \`${d}\``).join('\n');
      await interaction.editReply({
        content:
          `❌ No se encontró telemetría para el piloto **"${queryName}"** en las sesiones recientes.\n\n` +
          `**Pilotos con datos recientes:**\n${list}\n\n*Prueba usando \`/licencia nombre:TuNombreExacto\`*`,
      });
      return;
    }

    const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });

    try {
      const buffer = await generateDriverLicenseCard(profile, avatarUrl);
      const attachment = new AttachmentBuilder(buffer, { name: 'superlicencia.png' });

      const embed = new EmbedBuilder()
        .setTitle(`🏁 Superlicencia Oficial — ${profile.driverName}`)
        .setDescription(
          `**Piloto:** ${profile.driverName}\n` +
          `**Circuito:** ${profile.trackName}\n` +
          `**Mejor Vuelta:** \`${profile.bestLapFormatted}\` (*${profile.bestLapCar}*)\n` +
          `**Vueltas registradas:** ${profile.totalLaps} (${profile.cleanLaps} limpias)`
        )
        .setColor(0x00f2fe)
        .setImage('attachment://superlicencia.png')
        .setFooter({ text: 'LATAM SimRacing Alliance • Verificado con Emperor Server' })
        .setTimestamp(new Date());

      await interaction.editReply({
        embeds: [embed],
        files: [attachment],
      });
    } catch (err) {
      console.error('Error generando la tarjeta gráfica de licencia:', err);
      await interaction.editReply({
        content: '❌ Ocurrió un error al generar la tarjeta gráfica de licencia.',
      });
    }
  },
};
