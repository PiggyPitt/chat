import { User, UserStatus } from '../../../domain/entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: User): Promise<User>;
  updateStatus(id: string, status: UserStatus): Promise<User | null>;
  findByStatus(status: UserStatus): Promise<User[]>;
}
