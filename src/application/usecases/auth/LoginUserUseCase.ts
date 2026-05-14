import { IAuthService } from '../../interfaces/services/IAuthService';

export class LoginUserUseCase {
  constructor(private readonly authService: IAuthService) {}

  async execute(username: string, password: string) {
    return this.authService.login(username, password);
  }
}
