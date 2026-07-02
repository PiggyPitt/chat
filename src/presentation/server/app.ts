import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { resolve } from 'node:path';
import { createAuthRouter } from './routes/auth.routes.js';
import { createRoomRouter } from './routes/room.routes.js';
import { createUploadRouter } from './routes/upload.routes.js';
import { createAdminRouter } from './routes/admin.routes.js';
import { createPushRouter } from './routes/push.routes.js';
import { createGifRouter } from './routes/gif.routes.js';
import { AuthController } from './controllers/AuthController.js';
import { RoomController } from './controllers/RoomController.js';
import { UploadController } from './controllers/UploadController.js';
import { AdminController } from './controllers/AdminController.js';
import { PushController } from './controllers/PushController.js';
import { GifController } from './controllers/GifController.js';
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
  const pushController = new PushController(container.subscribePushUseCase, container.unsubscribePushUseCase, container.toggleMuteRoomUseCase, container.pushService);
  const gifController = new GifController(container.gifService);

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // GIF picker renders images directly from Giphy's CDN (media0-4/i.giphy.com)
        'img-src': ["'self'", 'data:', 'https://*.giphy.com'],
      },
    },
  }));
  app.use(express.json());
  app.use(cors());

  // serve uploaded images — dotfiles denied, no directory listing
  // Uploads must be viewable cross-origin (e.g. Vite dev server on a different port),
  // so override helmet's default same-origin Cross-Origin-Resource-Policy for this route.
  app.use('/uploads', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(resolve(config.uploadDir), { dotfiles: 'deny', index: false }));

  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
  });

  // Giphy free-tier keys are capped at ~42 req/hour — keep our own limit well under that.
  const gifLimiter = rateLimit({
    windowMs: 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many GIF requests, please try again later.' });
    }
  });

  app.use('/api/auth', limiter);
  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/rooms', createRoomRouter(roomController, authMiddleware));
  app.use('/api/upload', createUploadRouter(uploadController, authMiddleware));
  app.use('/api/admin', createAdminRouter(adminController, authMiddleware));
  app.use('/api/push', createPushRouter(pushController, authMiddleware));
  app.use('/api/gif', gifLimiter, createGifRouter(gifController, authMiddleware));

  if (config.env === 'production') {
    const frontendDist = resolve(process.cwd(), 'frontend', 'dist');
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => {
      res.sendFile(resolve(frontendDist, 'index.html'));
    });
  }

  app.use(errorMiddleware);

  return app;
}
