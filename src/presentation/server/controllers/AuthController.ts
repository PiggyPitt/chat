import { Request, Response, NextFunction } from 'express';
import { LoginUserUseCase } from '../../../application/usecases/auth/LoginUserUseCase';
import { RegisterUserUseCase } from '../../../application/usecases/auth/RegisterUserUseCase';
import { validateLogin, validateRegister } from '../../../shared/validation/validators.js';

export class AuthController {
  constructor(private readonly registerUseCase: RegisterUserUseCase, private readonly loginUseCase: LoginUserUseCase) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateRegister(req.body);
      const user = await this.registerUseCase.execute(req.body.username, req.body.password);
      res.status(201).json({ userId: user.id, username: user.username });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateLogin(req.body);
      const { user, token } = await this.loginUseCase.execute(req.body.username, req.body.password);
      res.status(200).json({ token, userId: user.id, username: user.username, role: user.role });
    } catch (error) {
      next(error);
    }
  }
}
