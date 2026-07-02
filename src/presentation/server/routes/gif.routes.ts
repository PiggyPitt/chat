import { Router } from 'express';
import { GifController } from '../controllers/GifController.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

export function createGifRouter(controller: GifController, authMiddleware: AuthMiddleware): Router {
  const router = Router();
  router.get('/search', authMiddleware.authenticate, controller.search);
  router.get('/trending', authMiddleware.authenticate, controller.trending);
  return router;
}
