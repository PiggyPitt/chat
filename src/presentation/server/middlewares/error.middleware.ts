import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';

export function errorMiddleware(error: unknown, req: Request, res: Response, next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
