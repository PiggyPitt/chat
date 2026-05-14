import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../application/interfaces/repositories/IUserRepository';
import { UserModel } from '../db/mongo/schemas/user.schema.js';

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean().exec();
    return doc ? new User({ id: doc._id.toString(), username: doc.username, passwordHash: doc.passwordHash, createdAt: doc.createdAt }) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const doc = await UserModel.findOne({ username }).lean().exec();
    return doc ? new User({ id: doc._id.toString(), username: doc.username, passwordHash: doc.passwordHash, createdAt: doc.createdAt }) : null;
  }

  async create(user: User): Promise<User> {
    const doc = await UserModel.create({ username: user.username, passwordHash: user.passwordHash });
    return new User({ id: doc._id.toString(), username: doc.username, passwordHash: doc.passwordHash, createdAt: doc.createdAt });
  }
}
