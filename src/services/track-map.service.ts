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
   * Obtiene la imagen del trazado de cualquier circuito.
   * Si la imagen es vertical (alto > ancho), la rota automáticamente 90°
   * para que en Discord siempre se visualice en formato panorámico / horizontal.
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
        // Fallback a procesar de nuevo si el archivo en disco está corrupto
      }
    }

    // 3. Generar variantes de URL (por si el servidor usa subcarpetas o nombres con guión)
    const urlsToTry: string[] = [mapUrl];
    if (mapUrl.includes('/content/tracks/')) {
      const subMatch = mapUrl.match(/\/content\/tracks\/([^\/]+)\/([^\/]+)\/map\.png$/);
      if (subMatch) {
        urlsToTry.push(mapUrl.replace(/\/content\/tracks\/([^\/]+)\/([^\/]+)\/map\.png$/, '/content/tracks/$1-$2/map.png'));
        urlsToTry.push(mapUrl.replace(/\/content\/tracks\/([^\/]+)\/([^\/]+)\/map\.png$/, '/content/tracks/$1/map.png'));
      }

      const hyphenMatch = mapUrl.match(/\/content\/tracks\/([^\/]+)-([^\/]+)\/map\.png$/);
      if (hyphenMatch) {
        urlsToTry.push(mapUrl.replace(/\/content\/tracks\/([^\/]+)-([^\/]+)\/map\.png$/, '/content/tracks/$1/$2/map.png'));
        urlsToTry.push(mapUrl.replace(/\/content\/tracks\/([^\/]+)-([^\/]+)\/map\.png$/, '/content/tracks/$1/map.png'));
      }
    }

    // 4. Intentar cargar y procesar la imagen
    for (const url of urlsToTry) {
      try {
        const img = await loadImage(url);

        let buffer: Buffer;

        // Si el circuito es vertical (alto > ancho), lo rotamos 90° a horizontal
        if (img.height > img.width) {
          const canvas = createCanvas(img.height, img.width);
          const ctx = canvas.getContext('2d');
          ctx.translate(img.height, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, 0, 0);
          buffer = canvas.toBuffer('image/png');
        } else {
          // Si ya es horizontal (ancho >= alto), lo dejamos tal cual
          const canvas = createCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          buffer = canvas.toBuffer('image/png');
        }

        // Guardar en memoria y disco para que las próximas consultas sean instantáneas
        this.memoryCache.set(safeKey, buffer);
        fs.promises.writeFile(diskPath, buffer).catch(() => null);

        return {
          attachment: new AttachmentBuilder(buffer, { name: 'track-layout.png' }),
          attachmentUrl: 'attachment://track-layout.png',
        };
      } catch {
        continue;
      }
    }

    console.warn(`⚠️ No se pudo obtener la imagen del trazado para ${mapUrl}`);
    return null;
  }
}

export const trackMapService = new TrackMapService();
