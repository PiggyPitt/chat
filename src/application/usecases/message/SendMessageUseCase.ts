import { IMessageService } from '../../interfaces/services/IMessageService';
import { Message } from '../../../domain/entities/Message';

export class SendMessageUseCase {
  constructor(private readonly messageService: IMessageService) {}

  async execute(roomId: string, senderId: string, senderUsername: string, content: string): Promise<Message> {
    return this.messageService.sendMessage(roomId, senderId, senderUsername, content);
  }
}
