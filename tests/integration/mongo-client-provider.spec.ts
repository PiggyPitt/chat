import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClientProvider } from '../../src/infrastructure/db/mongo/MongoClientProvider.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('MongoClientProvider', () => {
  it('returns the existing connection without reconnecting when already connected', async () => {
    expect(mongoose.connection.readyState).toBe(1);
    const result = await MongoClientProvider.connect();
    expect(result).toBe(mongoose);
    expect(mongoose.connection.readyState).toBe(1);
  });
});
