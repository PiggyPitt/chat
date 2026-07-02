import { IRoomService } from '../../interfaces/services/IRoomService';
import { Room } from '../../../domain/entities/Room';

export class JoinRoomUseCase {
  constructor(private readonly roomService: IRoomService) {}

  async execute(roomName: string, userId: string, password?: string, skipPasswordCheck?: boolean): Promise<Room> {
    return this.roomService.joinRoom(roomName, userId, password, skipPasswordCheck);
  }
}
