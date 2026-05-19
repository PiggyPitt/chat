import { Message, MessageType } from '../../../domain/entities/Message';

export interface IMessageService {
  sendMessage(roomId: string, senderId: string, senderUsername: string, content: string, type?: MessageType): Promise<Message>;
  getHistory(roomId: string, limit?: number, before?: Date): Promise<Message[]>;
  clearHistory(roomId: string): Promise<number>;
}
