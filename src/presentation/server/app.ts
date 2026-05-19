import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { resolve } from 'node:path';
import { createAuthRouter } from './routes/auth.routes.js';
import { createRoomRouter } from './routes/room.routes.js';
import { createUploadRouter } from './routes/upload.routes.js';
import { createAdminRouter } from './routes/admin.routes.js';
import { AuthController } from './controllers/AuthController.js';
import { RoomController } from './controllers/RoomController.js';
import { UploadController } from './controllers/UploadController.js';
import { AdminController } from './controllers/AdminController.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { UploadImageUseCase } from '../../application/usecases/image/UploadImageUseCase.js';
import { Container } from '../../application/di/container.js';
import { config } from '../../shared/config/index.js';

export function createApp(): express.Express {
  const app = express();
  const container = new Container();
  const authController = new AuthController(container.registerUseCase, container.loginUseCase);
  const roomController = new RoomController(container.listRoomsUseCase, container.createRoomUseCase, container.joinRoomUseCase, container.leaveRoomUseCase);
  const authMiddleware = new AuthMiddleware(container.authService);
  const uploadController = new UploadController(new UploadImageUseCase());
  const adminController = new AdminController(container.listPendingUsersUseCase, container.approveUserUseCase, container.rejectUserUseCase, container.clearRoomMessagesUseCase);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json());
  app.use(cors());

  // serve uploaded images — dotfiles denied, no directory listing
  app.use('/uploads', express.static(resolve(config.uploadDir), { dotfiles: 'deny', index: false }));

  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
  });

  app.use('/api/auth', limiter);
  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/rooms', createRoomRouter(roomController, authMiddleware));
  app.use('/api/upload', createUploadRouter(uploadController, authMiddleware));
  app.use('/api/admin', createAdminRouter(adminController, authMiddleware));

  app.use(errorMiddleware);

  return app;
}
