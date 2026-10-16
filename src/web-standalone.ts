import { startWebServer } from './web/server.js';
import { liveTimingService } from './services/livetiming.service.js';

const server = startWebServer(null);

const shutdown = () => {
  liveTimingService.stop();
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
