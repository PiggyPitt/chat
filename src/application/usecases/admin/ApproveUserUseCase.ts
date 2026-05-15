import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { HttpError } from '../../../shared/errors/HttpError';

export class ApproveUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(target: string): Promise<User> {
    const user = await this.resolveUser(target);
    const updated = await this.userRepository.updateStatus(user.id, 'approved');
    if (!updated) throw new HttpError('User not found', 404);
    return updated;
  }

  private async resolveUser(target: string): Promise<User> {
    const byUsername = await this.userRepository.findByUsername(target);
    if (byUsername) return byUsername;
    const byId = await this.userRepository.findById(target);
    if (byId) return byId;
    throw new HttpError(`User not found: ${target}`, 404);
  }
}
