import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../../application/interfaces/services/IAuthService';
import { HttpError } from '../../../shared/errors/HttpError';

export class AuthMiddleware {
  constructor(private readonly authService: IAuthService) {}

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorization = req.headers.authorization;
      if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new HttpError('Authorization header missing', 401);
      }
      const token = authorization.split(' ')[1];
      if (!token) {
        throw new HttpError('Invalid authorization header', 401);
      }
      const { userId, username, role } = await this.authService.verifyToken(token);
      req.userId = userId;
      req.username = username;
      req.role = role;
      next();
    } catch (error) {
      next(error);
    }
  };

  requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.role !== 'admin') {
      next(new HttpError('Admin access required', 403));
      return;
    }
    next();
  };
}
