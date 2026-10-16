import http from 'node:http';
import type { Client } from 'discord.js';
import { env } from '../config/env.js';
import { emperorService } from '../services/emperor.service.js';
import { liveTimingService } from '../services/livetiming.service.js';
import { tablesService, type CustomTable } from '../services/tables.service.js';
import { DASHBOARD_HTML } from './dashboard.html.js';

export function startWebServer(discordClient: Client): http.Server {
  liveTimingService.start();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // CORS básico por si se consume desde otro subdominio
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // 1. Página Principal del Portal Web
      if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(DASHBOARD_HTML);
        return;
      }

      // 2. Estado y Mapa en Tiempo Real (cada 1s)
      if (req.method === 'GET' && pathname === '/api/live') {
        const state = liveTimingService.getState();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(state));
        return;
      }

      // 3. Resumen de Assetto Corsa (Hotlaps + Campeonatos Emperor + Entry List)
      if (req.method === 'GET' && pathname === '/api/ac/overview') {
        const [hotlaps, championships, entryList] = await Promise.all([
          emperorService.getTrackHotlaps(false),
          emperorService.getChampionships(),
          emperorService.getEntryList(),
        ]);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            hotlaps,
            championships,
            entryList,
          })
        );
        return;
      }

      // 4. Obtener todas las tablas (AC y ACC)
      if (req.method === 'GET' && pathname === '/api/tables') {
        const tables = await tablesService.getAllTables();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(tables));
        return;
      }

      // 5. Crear o Editar una Tabla (requiere contraseña de Admin)
      if (req.method === 'POST' && pathname === '/api/tables') {
        const adminPass = req.headers['x-admin-password'];
        if (adminPass !== env.ADMIN_PASSWORD) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Contraseña de administrador incorrecta' }));
          return;
        }

        const body = await readJsonBody<CustomTable>(req);
        const saved = await tablesService.saveTable(body);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(saved));
        return;
      }

      // 6. Eliminar una Tabla
      const deleteMatch = pathname.match(/^\/api\/tables\/([^/]+)$/);
      if (req.method === 'DELETE' && deleteMatch) {
        const adminPass = req.headers['x-admin-password'];
        if (adminPass !== env.ADMIN_PASSWORD) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Contraseña de administrador incorrecta' }));
          return;
        }

        const id = decodeURIComponent(deleteMatch[1]);
        const deleted = await tablesService.deleteTable(id);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ deleted }));
        return;
      }

      // 7. Publicar una Tabla directamente en Discord desde el Panel Web
      const publishMatch = pathname.match(/^\/api\/tables\/([^/]+)\/publish-discord$/);
      if (req.method === 'POST' && publishMatch) {
        const adminPass = req.headers['x-admin-password'];
        if (adminPass !== env.ADMIN_PASSWORD) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Contraseña de administrador incorrecta' }));
          return;
        }

        const id = decodeURIComponent(publishMatch[1]);
        const ok = await tablesService.publishTableToDiscord(discordClient, id);
        res.writeHead(ok ? 200 : 400, {
          'Content-Type': 'application/json; charset=utf-8',
        });
        res.end(JSON.stringify({ published: ok }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    } catch (error) {
      console.error('Error en servidor web:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }
  });

  server.listen(env.WEB_PORT, '0.0.0.0', () => {
    console.log(`🌐 Portal Web & Live Timing corriendo en http://0.0.0.0:${env.WEB_PORT}`);
  });

  return server;
}

function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw) as T);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
