import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // buffer only — no temp files with user-controlled paths
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed`));
    }
  }
}).single('image');
