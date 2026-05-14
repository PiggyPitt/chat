import { Message } from '../../domain/entities/Message';
import { IMessageRepository } from '../../application/interfaces/repositories/IMessageRepository';
import { MessageModel } from '../db/mongo/schemas/message.schema.js';

export class MongoMessageRepository implements IMessageRepository {
  async create(message: Message): Promise<Message> {
    const doc = await MessageModel.create({ roomId: message.roomId, senderId: message.senderId, senderUsername: message.senderUsername, content: message.content });
    return new Message({ id: doc._id.toString(), roomId: doc.roomId, senderId: doc.senderId, senderUsername: doc.senderUsername, content: doc.content, createdAt: doc.createdAt });
  }

  async listByRoom(roomId: string, limit = 50): Promise<Message[]> {
    const docs = await MessageModel.find({ roomId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
    return docs.map((doc) => new Message({ id: doc._id.toString(), roomId: doc.roomId, senderId: doc.senderId, senderUsername: doc.senderUsername ?? doc.senderId, content: doc.content, createdAt: doc.createdAt })).reverse();
  }
}
