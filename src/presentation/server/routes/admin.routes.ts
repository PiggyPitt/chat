import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

export function createAdminRouter(controller: AdminController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.authenticate, auth.requireAdmin);
  router.get('/pending', controller.listPending);
  router.post('/approve/:target', controller.approve);
  router.post('/reject/:target', controller.reject);
  router.delete('/rooms/:name/messages', controller.clearRoomMessages);
  return router;
}
