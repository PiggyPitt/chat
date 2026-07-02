import mongoose from 'mongoose';

export const PushSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  { timestamps: true, collection: 'push_subscriptions' }
);

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export interface PushSubscriptionDocument extends mongoose.Document {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const PushSubscriptionModel = mongoose.model<PushSubscriptionDocument>('PushSubscription', PushSubscriptionSchema);
