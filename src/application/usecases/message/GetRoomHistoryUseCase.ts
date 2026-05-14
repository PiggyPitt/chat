import { IMessageService } from '../../interfaces/services/IMessageService';
import { Message } from '../../../domain/entities/Message';

export class GetRoomHistoryUseCase {
  constructor(private readonly messageService: IMessageService) {}

  async execute(roomId: string, limit = 50): Promise<Message[]> {
    return this.messageService.getHistory(roomId, limit);
  }
}
