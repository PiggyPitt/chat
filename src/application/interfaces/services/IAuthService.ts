import { User } from '../../../domain/entities/User';

export interface IAuthService {
  register(username: string, password: string): Promise<User>;
  login(username: string, password: string): Promise<{ user: User; token: string }>;
  verifyToken(token: string): Promise<{ userId: string; username: string }>;
}
