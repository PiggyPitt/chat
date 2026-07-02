import { IPushSubscriptionRepository, PushSubscriptionData } from '../../interfaces/repositories/IPushSubscriptionRepository.js';

export class SubscribePushUseCase {
  constructor(private readonly pushRepo: IPushSubscriptionRepository) {}

  async execute(userId: string, subscription: PushSubscriptionData): Promise<void> {
    await this.pushRepo.save(userId, subscription);
  }
}
