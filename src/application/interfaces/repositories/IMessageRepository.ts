import { Message } from '../../../domain/entities/Message';

export interface IMessageRepository {
  create(message: Message): Promise<Message>;
  listByRoom(roomId: string, limit?: number, before?: Date): Promise<Message[]>;
  deleteByRoom(roomId: string): Promise<number>;
}
