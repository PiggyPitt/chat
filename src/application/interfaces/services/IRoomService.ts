import { Room } from '../../../domain/entities/Room';

export interface IRoomService {
  listRooms(): Promise<Room[]>;
  createRoom(name: string, createdBy: string, password?: string): Promise<Room>;
  joinRoom(roomName: string, userId: string, password?: string, skipPasswordCheck?: boolean): Promise<Room>;
  leaveRoom(roomName: string, userId: string): Promise<Room>;
}
