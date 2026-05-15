import { Request, Response, NextFunction } from 'express';
import { UploadImageUseCase } from '../../../application/usecases/image/UploadImageUseCase.js';
import { HttpError } from '../../../shared/errors/HttpError.js';

export class UploadController {
  constructor(private readonly uploadImageUseCase: UploadImageUseCase) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw new HttpError('No image file provided', 400);

      const result = await this.uploadImageUseCase.execute({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };
}
