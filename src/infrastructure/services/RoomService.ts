import { IRoomService } from '../../application/interfaces/services/IRoomService';
import { IRoomRepository } from '../../application/interfaces/repositories/IRoomRepository';
import { IPasswordHashingService } from '../../application/interfaces/services/IPasswordHashingService';
import { Room } from '../../domain/entities/Room';
import { HttpError } from '../../shared/errors/HttpError';
import { randomUUID } from 'node:crypto';

export class RoomService implements IRoomService {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly hashingService: IPasswordHashingService
  ) {}

  async listRooms(): Promise<Room[]> {
    return this.roomRepository.list();
  }

  async createRoom(name: string, createdBy: string, password?: string): Promise<Room> {
    const existing = await this.roomRepository.findByName(name);
    if (existing) {
      throw new HttpError('Room already exists', 409);
    }
    const passwordHash = password ? await this.hashingService.hash(password) : undefined;
    const room = new Room({ id: randomUUID(), name, createdBy, members: [createdBy], passwordHash });
    return this.roomRepository.create(room);
  }

  async joinRoom(roomName: string, userId: string, password?: string): Promise<Room> {
    const room = await this.roomRepository.findByName(roomName);
    if (!room) {
      throw new HttpError('Room does not exist', 404);
    }

    if (room.hasPassword) {
      if (!password) {
        throw new HttpError('Room requires a password', 401);
      }
      const valid = await this.hashingService.verify(password, room.passwordHash!);
      if (!valid) {
        throw new HttpError('Incorrect room password', 401);
      }
    }

    return this.roomRepository.addMember(room.id, userId);
  }

  async leaveRoom(roomName: string, userId: string): Promise<Room> {
    const room = await this.roomRepository.findByName(roomName);
    if (!room) {
      throw new HttpError('Room does not exist', 404);
    }

    if (!room.members.includes(userId)) {
      throw new HttpError('User not a member of room', 400);
    }

    return this.roomRepository.removeMember(room.id, userId);
  }
}
