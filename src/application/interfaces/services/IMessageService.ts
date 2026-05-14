import { Message } from '../../../domain/entities/Message';

export interface IMessageService {
  sendMessage(roomId: string, senderId: string, senderUsername: string, content: string): Promise<Message>;
  getHistory(roomId: string, limit?: number): Promise<Message[]>;
}
