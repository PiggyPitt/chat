export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface UserPushSubscription {
  userId: string;
  subscription: PushSubscriptionData;
}

export interface IPushSubscriptionRepository {
  save(userId: string, subscription: PushSubscriptionData): Promise<void>;
  delete(userId: string, endpoint: string): Promise<void>;
  findByUserIds(userIds: string[]): Promise<UserPushSubscription[]>;
}
