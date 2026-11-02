import {
  AttachmentBuilder,
  ChannelType,
  EmbedBuilder,
  ForumChannel,
  GuildMember,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { SlashCommand } from './types.js';
import { env } from '../config/env.js';

export const postCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('Publica y administra contenido en los foros de mods (Solo Staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('publicar')
        .setDescription('Publica un nuevo mod o recurso en la galería del foro')
        .addStringOption((option) =>
          option
            .setName('categoria')
            .setDescription('Sección o foro donde se publicará el post')
            .setRequired(true)
            .addChoices(
              { name: '🚗 Mods de Autos', value: 'autos' },
              { name: '🏁 Mods de Circuitos', value: 'circuitos' },
              { name: '🛠️ Utilidades (Pure, PPFilters, etc.)', value: 'utilidades' }
            )
        )
        .addStringOption((option) =>
          option
            .setName('titulo')
            .setDescription('Título del mod (ej: Porsche Cup, DTM 2018 | Versión 1.1)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('link')
            .setDescription('Enlace de descarga del mod (Google Drive, Mega, MediaFire, etc.)')
            .setRequired(true)
        )
        .addAttachmentOption((option) =>
          option
            .setName('gif')
            .setDescription('Archivo GIF o imagen de portada para la galería')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('gif_url')
            .setDescription('URL directa de un GIF o imagen (si no subes archivo)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('descripcion')
            .setDescription('Descripción o notas adicionales (opcional)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('etiqueta')
            .setDescription('Nombre de etiqueta del foro a aplicar si corresponde (opcional)')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('editar')
        .setDescription('Edita un post de mod creado por el bot (link, portada, título)')
        .addStringOption((option) =>
          option
            .setName('post')
            .setDescription('ID o enlace directo del post/hilo de foro a modificar')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('titulo')
            .setDescription('Nuevo título para el post (opcional)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('link')
            .setDescription('Nuevo enlace de descarga del mod (opcional)')
            .setRequired(false)
        )
        .addAttachmentOption((option) =>
          option
            .setName('gif')
            .setDescription('Nuevo archivo GIF o imagen de portada (opcional)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('gif_url')
            .setDescription('Nueva URL directa de GIF o imagen (opcional)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('descripcion')
            .setDescription('Nueva descripción o notas adicionales (opcional)')
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember | null;
    const isAdmin = member?.permissions?.has(PermissionFlagsBits.Administrator);
    const hasModRole =
      member?.roles instanceof GuildMemberRoleManager
        ? member.roles.cache.has(env.MOD_ROLE_ID)
        : Array.isArray(member?.roles) && (member.roles as string[]).includes(env.MOD_ROLE_ID);

    if (!isAdmin && !hasModRole) {
      await interaction.reply({
        content: '❌ Solo los administradores y moderadores pueden utilizar este comando.',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'publicar') {
      await handlePublicar(interaction);
    } else if (subcommand === 'editar') {
      await handleEditar(interaction);
    }
  },
};

async function handlePublicar(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const categoria = interaction.options.getString('categoria', true);
  const titulo = interaction.options.getString('titulo', true).trim();
  const link = interaction.options.getString('link', true).trim();
  const gifAttachment = interaction.options.getAttachment('gif');
  const gifUrl = interaction.options.getString('gif_url')?.trim();
  const descripcion = interaction.options.getString('descripcion')?.trim();
  const etiqueta = interaction.options.getString('etiqueta')?.trim();

  if (!gifAttachment && !gifUrl) {
    await interaction.editReply({
      content:
        '⚠️ Para que el post se vea con su miniatura/animación en la galería del foro, debes adjuntar un **GIF/imagen** en la opción `gif` o indicar un link directo en `gif_url`.',
    });
    return;
  }

  let channelId = env.modsCarsChannelId;
  let categoriaLabel = 'Mods de Autos';

  if (categoria === 'circuitos') {
    channelId = env.modsTracksChannelId;
    categoriaLabel = 'Mods de Circuitos';
  } else if (categoria === 'utilidades') {
    channelId = env.modsUtilsChannelId;
    categoriaLabel = 'Utilidades (Pure, PPFilters, etc.)';
  }

  const targetChannel = await interaction.guild?.channels.fetch(channelId).catch(() => null);

  if (!targetChannel) {
    await interaction.editReply({
      content: `❌ No se encontró el canal de foro configurado para **${categoriaLabel}** (ID: \`${channelId}\`). Verifica que el bot esté en el servidor y tenga permisos.`,
    });
    return;
  }

  if (targetChannel.type !== ChannelType.GuildForum) {
    await interaction.editReply({
      content: `❌ El canal configurado (<#${channelId}>) no es un canal de tipo **Foro** (Forum Channel).`,
    });
    return;
  }

  const forumChannel = targetChannel as ForumChannel;

  // Manejo de etiquetas aplicadas
  const appliedTags: string[] = [];
  if (etiqueta && forumChannel.availableTags.length > 0) {
    const matched = forumChannel.availableTags.find(
      (t) =>
        t.name.toLowerCase() === etiqueta.toLowerCase() ||
        t.id === etiqueta
    );
    if (matched) {
      appliedTags.push(matched.id);
    }
  }

  // Si el foro requiere etiquetas obligatorias y no se especificó ninguna, asignamos la primera disponible
  // para evitar el error de Discord CANNOT_POST_WITHOUT_TAG (40060)
  const isTagRequired = (forumChannel.flags?.bitfield ?? 0) & 1; // 1 = REQUIRE_TAG en GuildForum
  if (appliedTags.length === 0 && isTagRequired && forumChannel.availableTags.length > 0) {
    appliedTags.push(forumChannel.availableTags[0].id);
  }

  // Contenido del mensaje principal (SOLO link y descripción opcional, sin URL de gif visible)
  const messageContent = descripcion ? `${link}\n\n${descripcion}` : link;

  let attachmentFile: AttachmentBuilder | null = null;
  try {
    attachmentFile = await resolveImageAttachment(gifAttachment, gifUrl);
  } catch (err: any) {
    await interaction.editReply({
      content: `❌ No se pudo procesar la imagen/GIF de portada: \`${err?.message || err}\``,
    });
    return;
  }

  const files = attachmentFile ? [attachmentFile] : [];

  try {
    const thread = await forumChannel.threads.create({
      name: titulo,
      message: {
        content: messageContent,
        files: files.length > 0 ? files : undefined,
      },
      appliedTags: appliedTags.length > 0 ? appliedTags : undefined,
    });

    // Agregar reacción de corazón ❤️ automáticamente
    const starterMessage = await thread.fetchStarterMessage().catch(() => null);
    if (starterMessage) {
      await starterMessage.react('❤️').catch(() => null);
    }

    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('✅ Post publicado exitosamente')
      .setDescription(`El mod se ha publicado en el foro <#${forumChannel.id}>.`)
      .addFields(
        { name: '📌 Título', value: `[${titulo}](${thread.url})`, inline: true },
        { name: '📂 Foro', value: categoriaLabel, inline: true },
        { name: '🔗 Link', value: link, inline: false }
      )
      .setFooter({ text: 'LATAM SimRacing Alliance • Galería de Mods' })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error: any) {
    console.error('Error al crear post en foro:', error);
    await interaction.editReply({
      content: `❌ Ocurrió un error al intentar crear el post en Discord: \`${error?.message || 'Error desconocido'}\``,
    });
  }
}

async function handleEditar(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const postInput = interaction.options.getString('post', true).trim();
  const nuevoTitulo = interaction.options.getString('titulo')?.trim();
  const nuevoLink = interaction.options.getString('link')?.trim();
  const nuevaDescripcion = interaction.options.getString('descripcion')?.trim();
  const nuevoGif = interaction.options.getAttachment('gif');
  const nuevoGifUrl = interaction.options.getString('gif_url')?.trim();

  if (!nuevoTitulo && !nuevoLink && !nuevaDescripcion && !nuevoGif && !nuevoGifUrl) {
    await interaction.editReply({
      content:
        '⚠️ Debes especificar al menos un dato a modificar: `titulo`, `link`, `gif`, `gif_url` o `descripcion`.',
    });
    return;
  }

  // Extraer el ID del hilo (si pegan la URL completa de Discord o el ID numérico)
  const idMatches = postInput.match(/\d{17,20}/g);
  const threadId = idMatches ? idMatches[idMatches.length - 1] : postInput;

  const channel = await interaction.guild?.channels.fetch(threadId).catch(() => null);
  if (!channel || !channel.isThread()) {
    await interaction.editReply({
      content: `❌ No se encontró ningún hilo o post con el ID o enlace: \`${postInput}\`.\nVerifica que sea el enlace de un post de foro y que el bot tenga acceso al canal.`,
    });
    return;
  }

  const thread = channel;

  // 1. Modificar título del post si se proveyó
  let tituloActualizado = false;
  if (nuevoTitulo && nuevoTitulo !== thread.name) {
    try {
      await thread.setName(nuevoTitulo);
      tituloActualizado = true;
    } catch (err: any) {
      console.warn('No se pudo renombrar el hilo:', err);
    }
  }

  // 2. Obtener el mensaje inicial del hilo
  const starterMessage = await thread.fetchStarterMessage().catch(() => null);
  if (!starterMessage) {
    await interaction.editReply({
      content: `⚠️ ${tituloActualizado ? `Se actualizó el título a **${nuevoTitulo}**, pero no` : 'No'} se pudo acceder al mensaje inicial del post.`,
    });
    return;
  }

  // Verificar que el mensaje haya sido publicado por el bot
  if (starterMessage.author.id !== interaction.client.user.id) {
    await interaction.editReply({
      content: `⚠️ El mensaje inicial fue publicado por <@${starterMessage.author.id}>.\nPor políticas de seguridad de la API de Discord, los bots solo pueden editar el contenido y archivos de los mensajes que ellos mismos enviaron.\n${
        tituloActualizado
          ? `✅ **El título del post sí fue actualizado a:** \`${nuevoTitulo}\`.`
          : ''
      }`,
    });
    return;
  }

  // 3. Modificar contenido y/o archivo
  const lines = starterMessage.content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let existingDownloadLink = '';
  const existingDescLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignorar si era un enlace a tenor, giphy, discord cdn o nombre de archivo de gif previo pegado en texto
    if (
      line.includes('tenor.com') ||
      line.includes('giphy.com') ||
      line.includes('cdn.discordapp.com') ||
      line.startsWith('📎') ||
      /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(line)
    ) {
      continue;
    }
    if (!existingDownloadLink && (line.startsWith('http://') || line.startsWith('https://'))) {
      existingDownloadLink = line;
    } else {
      existingDescLines.push(line);
    }
  }

  const finalLink = nuevoLink ?? existingDownloadLink;
  const finalDesc =
    nuevaDescripcion !== undefined ? nuevaDescripcion : existingDescLines.join('\n\n');

  const updatedContent = finalDesc ? `${finalLink}\n\n${finalDesc}` : finalLink;

  let newAttachmentFile: AttachmentBuilder | null = null;
  if (nuevoGif || nuevoGifUrl) {
    try {
      newAttachmentFile = await resolveImageAttachment(nuevoGif, nuevoGifUrl);
    } catch (err: any) {
      await interaction.editReply({
        content: `❌ Error al procesar el nuevo GIF/imagen: \`${err?.message || err}\``,
      });
      return;
    }
  }

  try {
    if (newAttachmentFile) {
      // Reemplaza el archivo adjunto previo por el nuevo binario descargado
      await starterMessage.edit({
        content: updatedContent,
        files: [newAttachmentFile],
        attachments: [],
      });
    } else if (updatedContent !== starterMessage.content) {
      await starterMessage.edit({
        content: updatedContent,
      });
    }

    const editEmbed = new EmbedBuilder()
      .setColor(0x00d4ff)
      .setTitle('✏️ Post actualizado correctamente')
      .setDescription(`Se actualizaron los datos del post en <#${thread.parentId}>.`)
      .addFields(
        { name: '📌 Post', value: `[${thread.name}](${thread.url})`, inline: true },
        { name: '🆔 ID', value: `\`${thread.id}\``, inline: true }
      )
      .setFooter({ text: 'LATAM SimRacing Alliance • Galería de Mods' })
      .setTimestamp();

    if (nuevoLink) {
      editEmbed.addFields({ name: '🔗 Nuevo Link', value: nuevoLink, inline: false });
    }

    await interaction.editReply({ embeds: [editEmbed] });
  } catch (error: any) {
    console.error('Error al editar starterMessage del foro:', error);
    await interaction.editReply({
      content: `❌ Ocurrió un error al editar el mensaje del post: \`${error?.message || 'Error desconocido'}\``,
    });
  }
}

/**
 * Descarga y resuelve una imagen o GIF desde un archivo adjunto o URL (incluyendo soporte para páginas de Tenor)
 * para adjuntarla como archivo binario real de Discord (Multipart Form Data).
 */
async function resolveImageAttachment(
  attachment?: { url: string; name?: string } | null,
  urlStr?: string | null
): Promise<AttachmentBuilder | null> {
  const targetUrl = attachment?.url || urlStr?.trim();
  if (!targetUrl) return null;

  let downloadUrl = targetUrl;

  // Si es un enlace a la página de visualización de Tenor (ej. https://tenor.com/view/...)
  if (targetUrl.includes('tenor.com/view/')) {
    try {
      const pageRes = await fetch(targetUrl);
      if (pageRes.ok) {
        const pageText = await pageRes.text();
        const match = pageText.match(/https:\/\/media\.tenor\.com\/[^"]+\.gif/);
        if (match) {
          downloadUrl = match[0];
        }
      }
    } catch (e) {
      console.warn('Error resolviendo enlace de Tenor:', e);
    }
  }

  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen (${res.status} ${res.statusText})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let name = attachment?.name;
  if (!name) {
    try {
      const parsed = new URL(downloadUrl);
      const filePart = parsed.pathname.split('/').pop();
      if (filePart && filePart.includes('.')) {
        name = filePart;
      }
    } catch {
      // ignore
    }
  }

  if (!name || !name.includes('.')) {
    name = 'portada.gif';
  }

  return new AttachmentBuilder(buffer, { name });
}
