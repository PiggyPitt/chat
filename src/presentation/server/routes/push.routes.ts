import { Router } from 'express';
import { PushController } from '../controllers/PushController.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

export function createPushRouter(controller: PushController, authMiddleware: AuthMiddleware): Router {
  const router = Router();
  router.get('/vapid-key', controller.getVapidKey);
  router.post('/subscribe', authMiddleware.authenticate, controller.subscribe);
  router.delete('/subscribe', authMiddleware.authenticate, controller.unsubscribe);
  router.patch('/mute/:roomId', authMiddleware.authenticate, controller.toggleMute);
  return router;
}
