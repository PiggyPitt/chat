import { User, UserStatus } from '../../domain/entities/User';
import { IUserRepository } from '../../application/interfaces/repositories/IUserRepository';
import { UserModel, UserDocument } from '../db/mongo/schemas/user.schema.js';

function toUser(doc: UserDocument & { _id: { toString(): string } }): User {
  return new User({
    id: doc._id.toString(),
    username: doc.username,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
    status: doc.status,
    role: doc.role,
    mutedRooms: doc.mutedRooms ?? []
  });
}

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDocument>().exec();
    return doc ? toUser(doc as UserDocument & { _id: { toString(): string } }) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const doc = await UserModel.findOne({ username }).lean<UserDocument>().exec();
    return doc ? toUser(doc as UserDocument & { _id: { toString(): string } }) : null;
  }

  async create(user: User): Promise<User> {
    const doc = await UserModel.create({
      username: user.username,
      passwordHash: user.passwordHash,
      status: user.status,
      role: user.role
    });
    return toUser(doc);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(id, { status }, { new: true }).lean<UserDocument>().exec();
    return doc ? toUser(doc as UserDocument & { _id: { toString(): string } }) : null;
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const docs = await UserModel.find({ status }).lean<UserDocument[]>().exec();
    return (docs as (UserDocument & { _id: { toString(): string } })[]).map(toUser);
  }

  async toggleMuteRoom(userId: string, roomId: string): Promise<{ mutedRooms: string[]; muted: boolean }> {
    const doc = await UserModel.findById(userId).exec();
    if (!doc) return { mutedRooms: [], muted: false };
    const alreadyMuted = doc.mutedRooms.includes(roomId);
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      alreadyMuted ? { $pull: { mutedRooms: roomId } } : { $addToSet: { mutedRooms: roomId } },
      { new: true }
    ).lean<UserDocument>().exec();
    const mutedRooms = (updated as UserDocument | null)?.mutedRooms ?? [];
    return { mutedRooms, muted: !alreadyMuted };
  }

  async getMutedRooms(userId: string): Promise<string[]> {
    const doc = await UserModel.findById(userId).select('mutedRooms').lean<UserDocument>().exec();
    return doc?.mutedRooms ?? [];
  }
}
