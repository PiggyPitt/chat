import { Message } from '../../domain/entities/Message';
import { IMessageRepository } from '../../application/interfaces/repositories/IMessageRepository';
import { MessageModel, MessageDocument } from '../db/mongo/schemas/message.schema.js';

export class MongoMessageRepository implements IMessageRepository {
  async create(message: Message): Promise<Message> {
    const doc = await MessageModel.create({
      roomId: message.roomId,
      senderId: message.senderId,
      senderUsername: message.senderUsername,
      type: message.type,
      content: message.content
    });
    return this.toDomain(doc as MessageDocument);
  }

  async listByRoom(roomId: string, limit = 50): Promise<Message[]> {
    const docs = await MessageModel.find({ roomId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
    return (docs as unknown as MessageDocument[]).map((doc) => this.toDomain(doc)).reverse();
  }

  private toDomain(doc: MessageDocument): Message {
    return new Message({
      id: doc._id.toString(),
      roomId: doc.roomId,
      senderId: doc.senderId,
      senderUsername: doc.senderUsername ?? doc.senderId,
      type: doc.type ?? 'text',
      content: doc.content,
      createdAt: doc.createdAt
    });
  }
}
