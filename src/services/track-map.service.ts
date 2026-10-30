import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';

export interface ProcessedTrackMap {
  attachment: AttachmentBuilder;
  attachmentUrl: string;
}

class TrackMapService {
  private memoryCache = new Map<string, Buffer>();
  private cacheDir = path.resolve(process.cwd(), 'data', 'cache', 'track-maps');

  constructor() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (err) {
      console.warn('⚠️ No se pudo inicializar la carpeta de caché para mapas:', err);
    }
  }

  /**
   * Obtiene la imagen del trazado del circuito.
   * Si la imagen es vertical (alto > ancho), la rota automáticamente 90°
   * para que en Discord se visualice de forma panorámica / horizontal.
   */
  public async getHorizontalTrackMapAttachment(
    mapUrl: string | undefined,
    trackKey?: string
  ): Promise<ProcessedTrackMap | null> {
    if (!mapUrl || !mapUrl.startsWith('http')) {
      return null;
    }

    const safeKey = (trackKey || mapUrl).replace(/[^a-zA-Z0-9_-]/g, '_');
    const diskPath = path.join(this.cacheDir, `${safeKey}.png`);

    // 1. Verificar caché en memoria RAM
    if (this.memoryCache.has(safeKey)) {
      const buffer = this.memoryCache.get(safeKey)!;
      return {
        attachment: new AttachmentBuilder(buffer, { name: 'track-layout.png' }),
        attachmentUrl: 'attachment://track-layout.png',
      };
    }

    // 2. Verificar caché en disco
    if (fs.existsSync(diskPath)) {
      try {
        const buffer = await fs.promises.readFile(diskPath);
        this.memoryCache.set(safeKey, buffer);
        return {
          attachment: new AttachmentBuilder(buffer, { name: 'track-layout.png' }),
          attachmentUrl: 'attachment://track-layout.png',
        };
      } catch {
        // Fallback a procesar de nuevo si el archivo está corrupto
      }
    }

    // 3. Descargar y procesar la imagen
    try {
      const img = await loadImage(mapUrl);

      let buffer: Buffer;

      // Si el mapa es vertical (alto > ancho), lo rotamos 90° en sentido horario
      // para que quede en orientación horizontal apaisada
      if (img.height > img.width) {
        const canvas = createCanvas(img.height, img.width);
        const ctx = canvas.getContext('2d');
        ctx.translate(img.height, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, 0, 0);
        buffer = canvas.toBuffer('image/png');
      } else {
        // Ya es horizontal: convertimos a buffer directo
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        buffer = canvas.toBuffer('image/png');
      }

      // Guardar en memoria y disco
      this.memoryCache.set(safeKey, buffer);
      fs.promises.writeFile(diskPath, buffer).catch(() => null);

      return {
        attachment: new AttachmentBuilder(buffer, { name: 'track-layout.png' }),
        attachmentUrl: 'attachment://track-layout.png',
      };
    } catch (err) {
      console.warn(`⚠️ Error al procesar imagen horizontal para ${mapUrl}:`, err);
      return null;
    }
  }
}

export const trackMapService = new TrackMapService();
