import { Router } from 'express';
import { RoomController } from '../controllers/RoomController.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

export function createRoomRouter(controller: RoomController, authMiddleware: AuthMiddleware): Router {
  const router = Router();
  router.get('/', authMiddleware.authenticate, controller.list.bind(controller));
  router.post('/', authMiddleware.authenticate, controller.create.bind(controller));
  router.post('/join', authMiddleware.authenticate, controller.join.bind(controller));
  router.post('/leave', authMiddleware.authenticate, controller.leave.bind(controller));
  return router;
}
