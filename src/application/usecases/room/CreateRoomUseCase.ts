import { IRoomService } from '../../interfaces/services/IRoomService';
import { Room } from '../../../domain/entities/Room';

export class CreateRoomUseCase {
  constructor(private readonly roomService: IRoomService) {}

  async execute(name: string, createdBy: string, password?: string): Promise<Room> {
    return this.roomService.createRoom(name, createdBy, password);
  }
}
