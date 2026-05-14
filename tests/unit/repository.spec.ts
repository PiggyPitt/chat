import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoRoomRepository } from '../../src/infrastructure/repositories/MongoRoomRepository.js';
import { MongoUserRepository } from '../../src/infrastructure/repositories/MongoUserRepository.js';
import { MongoMessageRepository } from '../../src/infrastructure/repositories/MongoMessageRepository.js';
import { Room } from '../../src/domain/entities/Room.js';

describe('Mongo repositories', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('creates and finds a user', async () => {
    const repo = new MongoUserRepository();
    const created = await repo.create({ id: 'u1', username: 'mike', passwordHash: 'hash', createdAt: new Date() });
    expect(created.username).toBe('mike');
    const found = await repo.findByUsername('mike');
    expect(found?.id).toBe(created.id);
  });

  it('creates and updates room membership', async () => {
    const repo = new MongoRoomRepository();
    const room = await repo.create(new Room({ id: 'r1', name: 'Test', createdBy: 'u1', members: ['u1'], createdAt: new Date() }));
    const updated = await repo.addMember(room.id, 'u2');
    expect(updated.members).toContain('u2');
    const removed = await repo.removeMember(room.id, 'u2');
    expect(removed.members).not.toContain('u2');
  });

  it('stores messages and retrieves room history', async () => {
    const repo = new MongoMessageRepository();
    await repo.create({ id: 'm1', roomId: 'r1', senderId: 'u1', senderUsername: 'mike', content: 'hello', createdAt: new Date() });
    const messages = await repo.listByRoom('r1');
    expect(messages[0]!.content).toBe('hello');
  });
});
