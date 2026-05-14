import http from 'http';
import { createApp } from './app.js';
import { MongoClientProvider } from '../../infrastructure/db/mongo/MongoClientProvider.js';
import { SocketServer } from '../../infrastructure/socket/SocketServer.js';
import { Container } from '../../application/di/container.js';
import { config } from '../../shared/config/index.js';
import { Logger } from '../../shared/logger/logger.js';

async function bootstrap(): Promise<void> {
  try {
    await MongoClientProvider.connect();
    const app = createApp();
    const httpServer = http.createServer(app);
    const container = new Container();
    new SocketServer(httpServer, container.authService, container.roomService, container.messageService).start();

    httpServer.listen(config.port, () => {
      Logger.info(`Server listening on port ${config.port}`);
      Logger.info(`Socket path: ${config.socketPath}`);
    });
  } catch (error) {
    Logger.error('Startup failure', error);
    process.exit(1);
  }
}

bootstrap();
