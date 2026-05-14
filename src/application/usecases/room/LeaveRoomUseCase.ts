import { IRoomService } from '../../interfaces/services/IRoomService';
import { Room } from '../../../domain/entities/Room';

export class LeaveRoomUseCase {
  constructor(private readonly roomService: IRoomService) {}

  async execute(roomName: string, userId: string): Promise<Room> {
    return this.roomService.leaveRoom(roomName, userId);
  }
}
