import { IRoomRepository } from '../../interfaces/repositories/IRoomRepository';
import { IMessageService } from '../../interfaces/services/IMessageService';
import { AppError } from '../../../shared/errors/AppError';

export class ClearRoomMessagesUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly messageService: IMessageService
  ) {}

  async execute(roomName: string): Promise<{ roomId: string; roomName: string; deletedCount: number }> {
    const room = await this.roomRepository.findByName(roomName);
    if (!room) throw new AppError(`Room "${roomName}" not found`, 404);
    const deletedCount = await this.messageService.clearHistory(room.id);
    return { roomId: room.id, roomName: room.name, deletedCount };
  }
}
