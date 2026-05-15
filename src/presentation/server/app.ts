import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createAuthRouter } from './routes/auth.routes.js';
import { createRoomRouter } from './routes/room.routes.js';
import { AuthController } from './controllers/AuthController.js';
import { RoomController } from './controllers/RoomController.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { Container } from '../../application/di/container.js';
import { config } from '../../shared/config/index.js';

export function createApp(): express.Express {
  const app = express();
  const container = new Container();
  const authController = new AuthController(container.registerUseCase, container.loginUseCase);
  const roomController = new RoomController(container.listRoomsUseCase, container.createRoomUseCase, container.joinRoomUseCase, container.leaveRoomUseCase);
  const authMiddleware = new AuthMiddleware(container.authService);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json());
  app.use(cors());

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

  app.use(errorMiddleware);

  return app;
}
