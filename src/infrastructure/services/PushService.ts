import webpush from 'web-push';
import { IPushSubscriptionRepository, PushSubscriptionData } from '../../application/interfaces/repositories/IPushSubscriptionRepository.js';
import { config } from '../../shared/config/index.js';
import { Logger } from '../../shared/logger/logger.js';

export interface PushPayload {
  title: string;
  body: string;
  roomId: string;
  roomName: string;
}

export class PushService {
  private readonly enabled: boolean;

  constructor(private readonly pushRepo: IPushSubscriptionRepository) {
    this.enabled = !!(config.vapidPublicKey && config.vapidPrivateKey);
    if (this.enabled) {
      webpush.setVapidDetails(config.vapidEmail, config.vapidPublicKey, config.vapidPrivateKey);
    }
  }

  get vapidPublicKey(): string {
    return config.vapidPublicKey;
  }

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!this.enabled || userIds.length === 0) return;
    const subs = await this.pushRepo.findByUserIds(userIds);
    const sends = subs.map(({ userId, subscription }) =>
      this.send(subscription, payload).catch((err: Error) => {
        if (err.message === 'SUBSCRIPTION_GONE') {
          this.pushRepo.delete(userId, subscription.endpoint).catch(() => {});
        }
      })
    );
    await Promise.allSettled(sends);
  }

  private async send(subscription: PushSubscriptionData, payload: PushPayload): Promise<void> {
    try {
      await webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify(payload));
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) throw new Error('SUBSCRIPTION_GONE');
      Logger.warn(`Push send failed: ${(err as Error).message}`);
    }
  }
}
