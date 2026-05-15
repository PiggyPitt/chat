import { Router } from 'express';
import { UploadController } from '../controllers/UploadController.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';

export function createUploadRouter(controller: UploadController, auth: AuthMiddleware): Router {
  const router = Router();
  router.post('/', auth.authenticate, uploadMiddleware, controller.upload);
  return router;
}
