import { IMessageService } from '../../application/interfaces/services/IMessageService';
import { IMessageRepository } from '../../application/interfaces/repositories/IMessageRepository';
import { Message, MessageType } from '../../domain/entities/Message';
import { randomUUID } from 'node:crypto';

export class MessageService implements IMessageService {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async sendMessage(roomId: string, senderId: string, senderUsername: string, content: string, type: MessageType = 'text'): Promise<Message> {
    const message = new Message({ id: randomUUID(), roomId, senderId, senderUsername, content, type });
    return this.messageRepository.create(message);
  }

  async getHistory(roomId: string, limit = 50, before?: Date): Promise<Message[]> {
    return this.messageRepository.listByRoom(roomId, limit, before);
  }

  async clearHistory(roomId: string): Promise<number> {
    return this.messageRepository.deleteByRoom(roomId);
  }
}
