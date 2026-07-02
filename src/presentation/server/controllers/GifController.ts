import { Request, Response, NextFunction } from 'express';
import { IGifService } from '../../../application/interfaces/services/IGifService.js';
import { HttpError } from '../../../shared/errors/HttpError.js';

export class GifController {
  constructor(private readonly gifService: IGifService) {}

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query['q'];
      if (typeof q !== 'string' || !q.trim()) {
        throw new HttpError('Query parameter "q" is required', 400);
      }
      const results = await this.gifService.search(q.trim());
      res.json({ results });
    } catch (err) {
      next(err);
    }
  };

  trending = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const results = await this.gifService.trending();
      res.json({ results });
    } catch (err) {
      next(err);
    }
  };
}
