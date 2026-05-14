import { Room } from '../../domain/entities/Room';
import { IRoomRepository } from '../../application/interfaces/repositories/IRoomRepository';
import { RoomModel } from '../db/mongo/schemas/room.schema.js';

export class MongoRoomRepository implements IRoomRepository {
  async findById(id: string): Promise<Room | null> {
    const doc = await RoomModel.findById(id).lean().exec();
    return doc ? new Room({ id: doc._id.toString(), name: doc.name, createdBy: doc.createdBy, members: doc.members, createdAt: doc.createdAt, passwordHash: doc.passwordHash }) : null;
  }

  async findByName(name: string): Promise<Room | null> {
    const doc = await RoomModel.findOne({ name }).lean().exec();
    return doc ? new Room({ id: doc._id.toString(), name: doc.name, createdBy: doc.createdBy, members: doc.members, createdAt: doc.createdAt, passwordHash: doc.passwordHash }) : null;
  }

  async list(): Promise<Room[]> {
    const docs = await RoomModel.find().sort({ createdAt: 1 }).lean().exec();
    return docs.map((doc) => new Room({ id: doc._id.toString(), name: doc.name, createdBy: doc.createdBy, members: doc.members, createdAt: doc.createdAt }));
  }

  async create(room: Room): Promise<Room> {
    const doc = await RoomModel.create({ name: room.name, createdBy: room.createdBy, members: room.members, passwordHash: room.passwordHash });
    return new Room({ id: doc._id.toString(), name: doc.name, createdBy: doc.createdBy, members: doc.members, createdAt: doc.createdAt, passwordHash: doc.passwordHash });
  }

  async addMember(roomId: string, userId: string): Promise<Room> {
    const doc = await RoomModel.findByIdAndUpdate(roomId, { $addToSet: { members: userId } }, { new: true }).lean().exec();
    if (!doc) {
      throw new Error('Room not found');
    }
    return new Room({ id: doc._id.toString(), name: doc.name, createdBy: doc.createdBy, members: doc.members, createdAt: doc.createdAt, passwordHash: doc.passwordHash });
  }

  async removeMember(roomId: string, userId: string): Promise<Room> {
    const doc = await RoomModel.findByIdAndUpdate(roomId, { $pull: { members: userId } }, { new: true }).lean().exec();
    if (!doc) {
      throw new Error('Room not found');
    }
    return new Room({ id: doc._id.toString(), name: doc.name, createdBy: doc.createdBy, members: doc.members, createdAt: doc.createdAt, passwordHash: doc.passwordHash });
  }
}
