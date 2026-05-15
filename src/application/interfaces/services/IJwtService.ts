import { UserRole } from '../../../domain/entities/User';

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface IJwtService {
  sign(payload: JwtPayload): string;
  verify(token: string): JwtPayload;
}
