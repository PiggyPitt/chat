import { IAuthService } from '../../interfaces/services/IAuthService';
import { User } from '../../../domain/entities/User';

export class RegisterUserUseCase {
  constructor(private readonly authService: IAuthService) {}

  async execute(username: string, password: string): Promise<User> {
    return this.authService.register(username, password);
  }
}
