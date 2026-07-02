import { IPushSubscriptionRepository } from '../../interfaces/repositories/IPushSubscriptionRepository.js';

export class UnsubscribePushUseCase {
  constructor(private readonly pushRepo: IPushSubscriptionRepository) {}

  async execute(userId: string, endpoint: string): Promise<void> {
    await this.pushRepo.delete(userId, endpoint);
  }
}
