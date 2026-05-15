import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import multer from 'multer';

export function errorMiddleware(error: unknown, req: Request, res: Response, next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  // multer errors (file size, file count, fileFilter rejection)
  if (error instanceof multer.MulterError) {
    res.status(422).json({ error: error.message });
    return;
  }

  // fileFilter cb(new Error(...)) — plain Error with known message
  if (error instanceof Error && error.message.startsWith('File type')) {
    res.status(422).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
