import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';

export class ListPendingUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findByStatus('pending');
  }
}
