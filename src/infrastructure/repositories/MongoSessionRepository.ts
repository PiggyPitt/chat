import { ISessionRepository } from '../../application/interfaces/repositories/ISessionRepository';
import { SessionModel } from '../db/mongo/schemas/session.schema.js';

export class MongoSessionRepository implements ISessionRepository {
  async create(userId: string, token: string): Promise<void> {
    await SessionModel.findOneAndUpdate({ userId }, { token }, { upsert: true, new: true }).exec();
  }

  async revoke(userId: string): Promise<void> {
    await SessionModel.deleteMany({ userId }).exec();
  }

  async findByToken(token: string): Promise<string | null> {
    const doc = await SessionModel.findOne({ token }).lean().exec();
    return doc ? doc.userId : null;
  }
}
