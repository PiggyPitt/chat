import { IAuthService } from '../../application/interfaces/services/IAuthService';
import { IUserRepository } from '../../application/interfaces/repositories/IUserRepository';
import { ISessionRepository } from '../../application/interfaces/repositories/ISessionRepository';
import { IPasswordHashingService } from '../../application/interfaces/services/IPasswordHashingService';
import { IJwtService } from '../../application/interfaces/services/IJwtService';
import { User, UserRole } from '../../domain/entities/User';
import { HttpError } from '../../shared/errors/HttpError';
import { randomUUID } from 'node:crypto';

function resolveRole(username: string): UserRole {
  const adminNames = (process.env['ADMIN_USERNAMES'] ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return adminNames.includes(username.toLowerCase()) ? 'admin' : 'user';
}

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

    const role = resolveRole(username);
    const passwordHash = await this.hashingService.hash(password);
    const user = new User({
      id: randomUUID(),
      username,
      passwordHash,
      status: 'pending',
      role
    });
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

    if (user.status === 'pending') {
      throw new HttpError('Your account is pending admin approval', 403);
    }
    if (user.status === 'rejected') {
      throw new HttpError('Your account registration was rejected', 403);
    }
    if (user.status === 'banned') {
      throw new HttpError('Your account has been banned', 403);
    }

    const token = this.jwtService.sign({ userId: user.id, username: user.username, role: user.role });
    await this.sessionRepository.create(user.id, token);
    return { user, token };
  }

  async verifyToken(token: string): Promise<{ userId: string; username: string; role: UserRole }> {
    const payload = this.jwtService.verify(token);
    const userId = await this.sessionRepository.findByToken(token);
    if (!userId || userId !== payload.userId) {
      throw new HttpError('Invalid or expired token', 401);
    }
    return { userId: payload.userId, username: payload.username, role: payload.role };
  }
}
