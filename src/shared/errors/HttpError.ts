import { AppError } from './AppError';

export class HttpError extends AppError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode, true);
  }
}
