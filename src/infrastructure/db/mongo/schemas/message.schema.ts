import mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderUsername: { type: String, required: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    content: { type: String, required: true }
  },
  { timestamps: true, collection: 'messages' }
);

export interface MessageDocument extends mongoose.Document {
  roomId: string;
  senderId: string;
  senderUsername: string;
  type: 'text' | 'image';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const MessageModel = mongoose.model<MessageDocument>('Message', MessageSchema);
