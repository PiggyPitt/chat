import { IPushSubscriptionRepository, PushSubscriptionData, UserPushSubscription } from '../../application/interfaces/repositories/IPushSubscriptionRepository.js';
import { PushSubscriptionModel } from '../db/mongo/schemas/push-subscription.schema.js';

export class MongoPushSubscriptionRepository implements IPushSubscriptionRepository {
  async save(userId: string, subscription: PushSubscriptionData): Promise<void> {
    await PushSubscriptionModel.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    ).exec();
  }

  async delete(userId: string, endpoint: string): Promise<void> {
    await PushSubscriptionModel.deleteOne({ userId, endpoint }).exec();
  }

  async findByUserIds(userIds: string[]): Promise<UserPushSubscription[]> {
    const docs = await PushSubscriptionModel.find({ userId: { $in: userIds } }).lean().exec();
    return docs.map((d) => ({
      userId: d.userId,
      subscription: { endpoint: d.endpoint, keys: d.keys }
    }));
  }
}
