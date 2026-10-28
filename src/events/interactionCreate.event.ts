import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  GuildMember,
  GuildMemberRoleManager,
  ModalBuilder,
  PermissionFlagsBits,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type Client,
} from 'discord.js';
import { commandsCollection } from '../commands/index.js';
import { env } from '../config/env.js';
import { reportsService } from '../services/reports.service.js';

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    // -------------------------------------------------------------
    // 1. MANEJO DE SLASH COMMANDS
    // -------------------------------------------------------------
    if (interaction.isChatInputCommand()) {
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
      return;
    }

    // -------------------------------------------------------------
    // 2. MANEJO DE FORMULARIOS MODAL
    // -------------------------------------------------------------
    if (interaction.isModalSubmit()) {
      // Envío de nuevo reporte por parte de un piloto
      if (interaction.customId === 'modal_report_incident') {
        const accused = interaction.fields.getTextInputValue('report_accused');
        const sessionTime = interaction.fields.getTextInputValue('report_session_time');
        const videoUrl = interaction.fields.getTextInputValue('report_video_url');
        const description = interaction.fields.getTextInputValue('report_description');

        const report = reportsService.createReport({
          reporterId: interaction.user.id,
          reporterTag: interaction.user.tag || interaction.user.username,
          accused,
          sessionTime,
          videoUrl,
          description,
        });

        // Enviar Embed al canal privado de comisarios
        try {
          const stewardsChannel = await client.channels.fetch(env.stewardsChannelId).catch(() => null);
          if (stewardsChannel && stewardsChannel.isTextBased()) {
            const stewardEmbed = new EmbedBuilder()
              .setTitle(`Reporte de Incidente • ${report.id}`)
              .setColor(0xe74c3c)
              .setDescription(
                `**Denunciante:** <@${interaction.user.id}> (${interaction.user.username})\n` +
                `**Piloto / Auto Denunciado:** \`${accused}\`\n` +
                `**Momento / Vuelta:** ${sessionTime}\n` +
                `**Video de Maniobra:** [Ver Video / Transmisión](${videoUrl})\n\n` +
                `**Descripción del incidente:**\n${description}`
              )
              .setFooter({ text: 'Sistema Oficial de Comisariato LSA' })
              .setTimestamp(new Date());

            const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`steward_penalize_${report.id}`)
                .setLabel('Sancionar')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`steward_dismiss_${report.id}`)
                .setLabel('Desestimar')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setLabel('Ver Video')
                .setStyle(ButtonStyle.Link)
                .setURL(videoUrl)
            );

            await (stewardsChannel as TextChannel).send({
              embeds: [stewardEmbed],
              components: [buttonsRow],
            });
          }
        } catch (err) {
          console.error('Error notificando a los comisarios:', err);
        }

        await interaction.reply({
          content:
            `Tu denuncia ha sido registrada con el código **\`${report.id}\`**.\n` +
            `Los comisarios deportivos analizarán el video y los datos de telemetría a la brevedad.`,
          ephemeral: true,
        });
        return;
      }

      // Resolución de sanción aplicada por un comisario
      if (interaction.customId.startsWith('modal_resolve_penalty_')) {
        const reportId = interaction.customId.replace('modal_resolve_penalty_', '');
        const penaltyApplied = interaction.fields.getTextInputValue('penalty_applied');
        const penaltyReason = interaction.fields.getTextInputValue('penalty_reason');

        const report = reportsService.resolveReport(
          reportId,
          'PENALIZED',
          interaction.user.tag || interaction.user.username,
          `${penaltyApplied} — ${penaltyReason}`
        );

        if (!report) {
          await interaction.reply({ content: 'Reporte no encontrado.', ephemeral: true });
          return;
        }

        // Actualizar el mensaje del canal de comisarios
        try {
          if (interaction.message) {
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
              .setColor(0x9b59b6)
              .addFields({
                name: 'RESOLUCIÓN OFICIAL (SANCIÓN APLICADA)',
                value: `**Comisario:** <@${interaction.user.id}>\n**Sanción:** \`${penaltyApplied}\`\n**Motivo:** ${penaltyReason}`,
              });

            await interaction.message.edit({
              embeds: [updatedEmbed],
              components: [],
            });
          }
        } catch (err) {
          console.error('Error actualizando mensaje de comisarios:', err);
        }

        // Publicar en el canal público de sanciones
        try {
          const sanctionsChannel = await client.channels.fetch(env.sanctionsChannelId).catch(() => null);
          if (sanctionsChannel && sanctionsChannel.isTextBased()) {
            const publicEmbed = new EmbedBuilder()
              .setTitle(`Veredicto de Comisariato • Caso ${report.id}`)
              .setColor(0xe74c3c)
              .setDescription(
                `**Piloto / Auto Sancionado:** \`${report.accused}\`\n` +
                `**Sesión / Momento:** ${report.sessionTime}\n` +
                `**Sanción Aplicada:** **${penaltyApplied}**\n` +
                `**Motivo:** ${penaltyReason}\n` +
                `**Prueba en Video:** [Enlace a la repetición](${report.videoUrl})\n\n` +
                `*Resolución emitida por el Colegio de Comisarios Deportivos de LSA.*`
              )
              .setTimestamp(new Date());

            await (sanctionsChannel as TextChannel).send({ embeds: [publicEmbed] });
          }
        } catch (err) {
          console.error('Error publicando sanción oficial:', err);
        }

        await interaction.reply({
          content: `Sanción para el reporte **${reportId}** aplicada y publicada correctamente.`,
          ephemeral: true,
        });
        return;
      }
    }

    // -------------------------------------------------------------
    // 3. MANEJO DE BOTONES INTERACTIVOS
    // -------------------------------------------------------------
    if (interaction.isButton()) {
      if (
        interaction.customId.startsWith('steward_penalize_') ||
        interaction.customId.startsWith('steward_dismiss_')
      ) {
        // Verificar rol de moderador o administrador
        const member = interaction.member as GuildMember | null;
        const hasModRole =
          member?.roles instanceof GuildMemberRoleManager
            ? member.roles.cache.has(env.MOD_ROLE_ID)
            : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);
        const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);

        if (!hasModRole && !isAdmin) {
          await interaction.reply({
            content: 'Solo los comisarios deportivos y moderadores pueden resolver incidentes.',
            ephemeral: true,
          });
          return;
        }

        // Caso: Desestimar reporte
        if (interaction.customId.startsWith('steward_dismiss_')) {
          const reportId = interaction.customId.replace('steward_dismiss_', '');
          const report = reportsService.resolveReport(
            reportId,
            'DISMISSED',
            interaction.user.tag || interaction.user.username,
            'Maniobra considerada Lance de Carrera o No Punible'
          );

          if (!report) {
            await interaction.reply({ content: 'Reporte no encontrado.', ephemeral: true });
            return;
          }

          if (interaction.message) {
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
              .setColor(0x2ecc71)
              .addFields({
                name: 'RESOLUCIÓN OFICIAL (DESESTIMADO)',
                value: `**Comisario:** <@${interaction.user.id}>\n**Dictamen:** Lance de carrera / No punible. Caso cerrado sin sanción.`,
              });

            await interaction.message.edit({
              embeds: [updatedEmbed],
              components: [],
            });
          }

          await interaction.reply({
            content: `Reporte **${reportId}** desestimado como lance de carrera.`,
            ephemeral: true,
          });
          return;
        }

        // Caso: Aplicar sanción (Abrir Modal para ingresar sanción y motivo)
        if (interaction.customId.startsWith('steward_penalize_')) {
          const reportId = interaction.customId.replace('steward_penalize_', '');

          const modal = new ModalBuilder()
            .setCustomId(`modal_resolve_penalty_${reportId}`)
            .setTitle(`Aplicar Sanción • Caso ${reportId}`);

          const penaltyInput = new TextInputBuilder()
            .setCustomId('penalty_applied')
            .setLabel('Sanción a aplicar')
            .setPlaceholder('Ej: +5 segundos de recargo / Descalificación / Amonestación')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

          const reasonInput = new TextInputBuilder()
            .setCustomId('penalty_reason')
            .setLabel('Motivo / Justificación oficial')
            .setPlaceholder('Ej: Cierre de línea en frenada provocando trompo al auto rival.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);

          modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(penaltyInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
          );

          await interaction.showModal(modal);
          return;
        }
      }
    }
  });
}
