import { IAuthService } from '../../application/interfaces/services/IAuthService';
import { IUserRepository } from '../../application/interfaces/repositories/IUserRepository';
import { ISessionRepository } from '../../application/interfaces/repositories/ISessionRepository';
import { IPasswordHashingService } from '../../application/interfaces/services/IPasswordHashingService';
import { IJwtService } from '../../application/interfaces/services/IJwtService';
import { User } from '../../domain/entities/User';
import { HttpError } from '../../shared/errors/HttpError';
import { randomUUID } from 'node:crypto';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly hashingService: IPasswordHashingService,
    private readonly jwtService: IJwtService
  ) {}

  async register(username: string, password: string): Promise<User> {
    const existing = await this.userRepository.findByUsername(username);
    if (existing) {
      throw new HttpError('Username is already taken', 409);
    }

    const passwordHash = await this.hashingService.hash(password);
    const user = new User({ id: randomUUID(), username, passwordHash });
    return this.userRepository.create(user);
  }

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new HttpError('Invalid username or password', 401);
    }

    const valid = await this.hashingService.verify(password, user.passwordHash);
    if (!valid) {
      throw new HttpError('Invalid username or password', 401);
    }

    const token = this.jwtService.sign({ userId: user.id, username: user.username });
    await this.sessionRepository.create(user.id, token);
    return { user, token };
  }

  async verifyToken(token: string): Promise<{ userId: string; username: string }> {
    const payload = this.jwtService.verify(token);
    const userId = await this.sessionRepository.findByToken(token);
    if (!userId || userId !== payload.userId) {
      throw new HttpError('Invalid or expired token', 401);
    }
    return { userId: payload.userId, username: payload.username };
  }
}
