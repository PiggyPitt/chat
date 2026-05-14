import { IRoomService } from '../../interfaces/services/IRoomService';
import { Room } from '../../../domain/entities/Room';

export class ListRoomsUseCase {
  constructor(private readonly roomService: IRoomService) {}

  async execute(): Promise<Room[]> {
    return this.roomService.listRooms();
  }
}
