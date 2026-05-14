import { Room } from '../../../domain/entities/Room';

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findByName(name: string): Promise<Room | null>;
  list(): Promise<Room[]>;
  create(room: Room): Promise<Room>;
  addMember(roomId: string, userId: string): Promise<Room>;
  removeMember(roomId: string, userId: string): Promise<Room>;
}
