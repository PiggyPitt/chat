import mongoose from 'mongoose';

export const SessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    token: { type: String, required: true, unique: true }
  },
  { timestamps: true, collection: 'sessions' }
);

export interface SessionDocument extends mongoose.Document {
  userId: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SessionModel = mongoose.model<SessionDocument>('Session', SessionSchema);
