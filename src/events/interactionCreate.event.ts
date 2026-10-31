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
import { buildReportModal } from '../commands/reportar.command.js';
import { sendReportPanelToChannel } from '../commands/panel-reportes.command.js';
import { GAME_ROLES_LIST } from '../commands/panel-roles.command.js';
import { env } from '../config/env.js';
import { reportsService, type GameType } from '../services/reports.service.js';

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
      // Envío de nuevo reporte por parte de un piloto (AC o ACC)
      if (
        interaction.customId === 'modal_report_incident' ||
        interaction.customId === 'modal_report_incident_AC' ||
        interaction.customId === 'modal_report_incident_ACC'
      ) {
        let game: GameType = 'AC';
        if (interaction.customId === 'modal_report_incident_ACC') {
          game = 'ACC';
        } else if (interaction.channelId === env.accReportChannelId) {
          game = 'ACC';
        }

        let driverName = 'Piloto';
        try {
          driverName = interaction.fields.getTextInputValue('report_driver_name');
        } catch {
          driverName = interaction.user.username;
        }

        const accused = interaction.fields.getTextInputValue('report_accused');
        const sessionTime = interaction.fields.getTextInputValue('report_session_time');
        const description = interaction.fields.getTextInputValue('report_description');

        const report = reportsService.createReport({
          game,
          reporterId: interaction.user.id,
          reporterTag: interaction.user.tag || interaction.user.username,
          reporterDriverName: driverName,
          accused,
          sessionTime,
          description,
        });

        const gameName = game === 'ACC' ? 'Assetto Corsa Competizione' : 'Assetto Corsa';
        const stewardsChannelId =
          game === 'ACC' ? env.accStewardsChannelId : env.acStewardsChannelId;

        // Enviar Embed al canal privado correspondiente de comisarios
        try {
          const stewardsChannel = await client.channels
            .fetch(stewardsChannelId)
            .catch(() => null);

          if (stewardsChannel && stewardsChannel.isTextBased()) {
            const stewardEmbed = new EmbedBuilder()
              .setTitle(`Denuncia de Incidente • [${game}] • ${report.id}`)
              .setColor(game === 'ACC' ? 0xe67e22 : 0xe74c3c)
              .setDescription(
                `**Simulador:** \`${gameName}\`\n` +
                `**Piloto Denunciante:** **${driverName}** (<@${interaction.user.id}>)\n` +
                `**Piloto / Auto Denunciado:** \`${accused}\`\n` +
                `**Momento Exacto / Vuelta:** ${sessionTime}\n\n` +
                `**Descripción del incidente:**\n${description}`
              )
              .setFooter({ text: `LATAM SimRacing Alliance • ${gameName}` })
              .setTimestamp(new Date());

            const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`steward_penalize_${report.id}`)
                .setLabel('Sancionar')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`steward_dismiss_${report.id}`)
                .setLabel('Desestimar')
                .setStyle(ButtonStyle.Secondary)
            );

            await (stewardsChannel as TextChannel).send({
              embeds: [stewardEmbed],
              components: [buttonsRow],
            });
          } else {
            console.warn(`⚠️ No se encontró el canal de comisarios (${stewardsChannelId})`);
          }
        } catch (err) {
          console.error('Error notificando a los comisarios:', err);
        }

        await interaction.reply({
          content:
            `✅ Tu denuncia para **${gameName}** ha sido registrada con el código **\`${report.id}\`**.\n` +
            `El staff analizará la repetición y los datos a la brevedad.`,
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

        const gameName = report.game === 'ACC' ? 'Assetto Corsa Competizione' : 'Assetto Corsa';

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

        // Publicar en el canal público de sanciones si existe y está configurado
        try {
          if (
            env.sanctionsChannelId &&
            env.sanctionsChannelId !== env.acStewardsChannelId &&
            env.sanctionsChannelId !== env.accStewardsChannelId
          ) {
            const sanctionsChannel = await client.channels
              .fetch(env.sanctionsChannelId)
              .catch(() => null);

            if (sanctionsChannel && sanctionsChannel.isTextBased()) {
              const publicEmbed = new EmbedBuilder()
                .setTitle(`Veredicto de Comisariato • [${gameName}] • Caso ${report.id}`)
                .setColor(0xe74c3c)
                .setDescription(
                  `**Simulador:** \`${gameName}\`\n` +
                  `**Piloto / Auto Sancionado:** \`${report.accused}\`\n` +
                  `**Sesión / Momento:** ${report.sessionTime}\n` +
                  `**Sanción Aplicada:** **${penaltyApplied}**\n` +
                  `**Motivo:** ${penaltyReason}\n\n` +
                  `*Resolución emitida por LATAM SimRacing Alliance.*`
                )
                .setTimestamp(new Date());

              await (sanctionsChannel as TextChannel).send({ embeds: [publicEmbed] });
            }
          }
        } catch (err) {
          console.error('Error publicando sanción oficial:', err);
        }

        await interaction.reply({
          content: `✅ Sanción para el reporte **${reportId}** ([${gameName}]) aplicada y registrada correctamente.`,
          ephemeral: true,
        });
        return;
      }
    }

    // -------------------------------------------------------------
    // 3. MANEJO DE BOTONES INTERACTIVOS
    // -------------------------------------------------------------
    if (interaction.isButton()) {
      // Publicación interactiva de paneles desde /panel-reportes
      if (
        interaction.customId === 'publish_panel_action_AC' ||
        interaction.customId === 'publish_panel_action_ACC' ||
        interaction.customId === 'publish_panel_action_BOTH'
      ) {
        const member = interaction.member as GuildMember | null;
        const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);
        const hasModRole =
          member?.roles instanceof GuildMemberRoleManager
            ? member.roles.cache.has(env.MOD_ROLE_ID)
            : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);

        if (!isAdmin && !hasModRole) {
          await interaction.reply({
            content: '❌ Solo los administradores pueden publicar el panel.',
            ephemeral: true,
          });
          return;
        }

        if (interaction.customId === 'publish_panel_action_BOTH') {
          const acCh = (await client.channels
            .fetch(env.acReportChannelId)
            .catch(() => null)) as TextChannel | null;
          const accCh = (await client.channels
            .fetch(env.accReportChannelId)
            .catch(() => null)) as TextChannel | null;

          if (acCh && acCh.isTextBased()) await sendReportPanelToChannel(acCh, 'AC');
          if (accCh && accCh.isTextBased()) await sendReportPanelToChannel(accCh, 'ACC');

          await interaction.reply({
            content: `✅ Paneles publicados en <#${env.acReportChannelId}> (AC) y en <#${env.accReportChannelId}> (ACC).`,
            ephemeral: true,
          });
          return;
        }

        const game = interaction.customId === 'publish_panel_action_ACC' ? 'ACC' : 'AC';
        const targetChannelId = game === 'ACC' ? env.accReportChannelId : env.acReportChannelId;
        const targetChannel = (await client.channels
          .fetch(targetChannelId)
          .catch(() => null)) as TextChannel | null;

        if (!targetChannel || !targetChannel.isTextBased()) {
          await interaction.reply({ content: '❌ No se pudo encontrar el canal.', ephemeral: true });
          return;
        }

        await sendReportPanelToChannel(targetChannel, game);
        await interaction.reply({
          content: `✅ Panel de reportes de **${game === 'ACC' ? 'ACC' : 'Assetto Corsa'}** publicado en <#${targetChannel.id}>.`,
          ephemeral: true,
        });
        return;
      }

      // Asignación / Remoción interactiva de roles de juegos
      if (interaction.customId.startsWith('role_game_toggle_')) {
        const gameId = interaction.customId.replace('role_game_toggle_', '');
        const gameDef = GAME_ROLES_LIST.find((g) => g.id === gameId);

        if (!gameDef) {
          await interaction.reply({ content: 'Juego no reconocido.', ephemeral: true });
          return;
        }

        const guild = interaction.guild;
        const member = interaction.member as GuildMember | null;

        if (!guild || !member) {
          await interaction.reply({ content: 'Esta acción solo puede realizarse en un servidor.', ephemeral: true });
          return;
        }

        // Buscar el rol en el servidor (o crearlo si todavía no existe)
        let role = guild.roles.cache.find(
          (r) => r.name.toLowerCase() === gameDef.name.toLowerCase()
        );

        if (!role) {
          try {
            role = await guild.roles.create({
              name: gameDef.name,
              color: gameDef.color,
              reason: `Creación automática de rol de juego para ${gameDef.name}`,
            });
          } catch (err) {
            console.error(`Error creando rol para ${gameDef.name}:`, err);
            await interaction.reply({
              content: '❌ No se pudo crear el rol en el servidor. Verifica los permisos del bot.',
              ephemeral: true,
            });
            return;
          }
        }

        // Si el usuario ya tiene el rol, se lo quitamos; si no lo tiene, se lo asignamos
        const hasRole = member.roles.cache.has(role.id);

        try {
          if (hasRole) {
            await member.roles.remove(role);
            await interaction.reply({
              content: `❌ Se te ha retirado el rol **${gameDef.name}**.`,
              ephemeral: true,
            });
          } else {
            await member.roles.add(role);
            await interaction.reply({
              content: `✅ ¡Se te ha asignado el rol **${gameDef.name}**!`,
              ephemeral: true,
            });
          }
        } catch (err) {
          console.error(`Error alternando rol para ${gameDef.name}:`, err);
          await interaction.reply({
            content: '❌ Error al modificar tus roles. Verifica que el rol del bot esté por encima en la jerarquía de roles de Discord.',
            ephemeral: true,
          });
        }
        return;
      }

      // Abrir modal de reporte desde los paneles oficiales o selector
      if (interaction.customId === 'open_report_modal_AC') {
        await interaction.showModal(buildReportModal('AC'));
        return;
      }
      if (interaction.customId === 'open_report_modal_ACC') {
        await interaction.showModal(buildReportModal('ACC'));
        return;
      }

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
            content: '❌ Solo los comisarios deportivos y administradores pueden resolver incidentes.',
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
            content: `✅ Reporte **${reportId}** desestimado como lance de carrera.`,
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
