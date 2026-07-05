import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoUserRepository } from '../../src/infrastructure/repositories/MongoUserRepository.js';
import { MongoRoomRepository } from '../../src/infrastructure/repositories/MongoRoomRepository.js';
import { MongoMessageRepository } from '../../src/infrastructure/repositories/MongoMessageRepository.js';
import { MongoSessionRepository } from '../../src/infrastructure/repositories/MongoSessionRepository.js';
import { MongoPushSubscriptionRepository } from '../../src/infrastructure/repositories/MongoPushSubscriptionRepository.js';
import { User } from '../../src/domain/entities/User.js';
import { Room } from '../../src/domain/entities/Room.js';
import { Message } from '../../src/domain/entities/Message.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({});
  }
});

describe('MongoUserRepository', () => {
  const repo = new MongoUserRepository();

  it('creates and finds a user by username and id', async () => {
    const created = await repo.create(new User({ id: 'ignored', username: 'mike', passwordHash: 'hash' }));
    expect(created.username).toBe('mike');
    expect(created.status).toBe('pending');

    expect((await repo.findByUsername('mike'))?.id).toBe(created.id);
    expect((await repo.findById(created.id))?.username).toBe('mike');
  });

  it('returns null for users that do not exist', async () => {
    expect(await repo.findByUsername('ghost')).toBeNull();
    expect(await repo.findById(new mongoose.Types.ObjectId().toString())).toBeNull();
  });

  it('returns null instead of throwing when the id is not a valid ObjectId', async () => {
    expect(await repo.findById('not-an-object-id')).toBeNull();
  });

  it('updates status and lists users by status', async () => {
    const created = await repo.create(new User({ id: 'ignored', username: 'anna', passwordHash: 'hash' }));

    const updated = await repo.updateStatus(created.id, 'approved');
    expect(updated?.status).toBe('approved');

    expect((await repo.findByStatus('pending')).some((u) => u.id === created.id)).toBe(false);
    expect((await repo.findByStatus('approved')).some((u) => u.id === created.id)).toBe(true);
  });

  it('returns null updating the status of a missing user', async () => {
    const result = await repo.updateStatus(new mongoose.Types.ObjectId().toString(), 'approved');
    expect(result).toBeNull();
  });

  it('toggles a room mute on and off', async () => {
    const created = await repo.create(new User({ id: 'ignored', username: 'bob', passwordHash: 'hash' }));

    expect(await repo.toggleMuteRoom(created.id, 'room-1')).toEqual({ mutedRooms: ['room-1'], muted: true });
    expect(await repo.toggleMuteRoom(created.id, 'room-1')).toEqual({ mutedRooms: [], muted: false });
    expect(await repo.getMutedRooms(created.id)).toEqual([]);
  });

  it('toggleMuteRoom on a missing user resolves to an empty, unmuted result', async () => {
    const result = await repo.toggleMuteRoom(new mongoose.Types.ObjectId().toString(), 'room-1');
    expect(result).toEqual({ mutedRooms: [], muted: false });
  });

  it('getMutedRooms on a missing user returns an empty array', async () => {
    expect(await repo.getMutedRooms(new mongoose.Types.ObjectId().toString())).toEqual([]);
  });
});

describe('MongoRoomRepository', () => {
  const repo = new MongoRoomRepository();

  it('creates, finds, and lists rooms', async () => {
    const created = await repo.create(new Room({ id: 'ignored', name: 'General', createdBy: 'u1' }));
    expect(created.name).toBe('General');

    expect((await repo.findById(created.id))?.name).toBe('General');
    expect((await repo.findByName('General'))?.id).toBe(created.id);
    expect(await repo.list()).toHaveLength(1);
  });

  it('returns null for a room that does not exist', async () => {
    expect(await repo.findByName('Ghost')).toBeNull();
    expect(await repo.findById(new mongoose.Types.ObjectId().toString())).toBeNull();
  });

  it('adds and removes members', async () => {
    const created = await repo.create(new Room({ id: 'ignored', name: 'Squad', createdBy: 'u1' }));

    expect((await repo.addMember(created.id, 'u2')).members).toContain('u2');
    expect((await repo.removeMember(created.id, 'u2')).members).not.toContain('u2');
  });

  it('throws adding a member to a room that does not exist', async () => {
    await expect(repo.addMember(new mongoose.Types.ObjectId().toString(), 'u2')).rejects.toThrow('Room not found');
  });

  it('throws removing a member from a room that does not exist', async () => {
    await expect(repo.removeMember(new mongoose.Types.ObjectId().toString(), 'u2')).rejects.toThrow('Room not found');
  });
});

describe('MongoMessageRepository', () => {
  const repo = new MongoMessageRepository();

  it('creates and lists messages for a room, oldest first', async () => {
    const first = await repo.create(
      new Message({ id: 'ignored', roomId: 'r1', senderId: 'u1', senderUsername: 'mike', content: 'hi' })
    );
    const second = await repo.create(
      new Message({
        id: 'ignored',
        roomId: 'r1',
        senderId: 'u1',
        senderUsername: 'mike',
        content: '/uploads/x.png',
        type: 'image'
      })
    );

    const history = await repo.listByRoom('r1');
    expect(history.map((m) => m.id)).toEqual([first.id, second.id]);
    expect(history[1]?.type).toBe('image');
  });

  it('filters history by the "before" cursor', async () => {
    await repo.create(new Message({ id: 'ignored', roomId: 'r2', senderId: 'u1', senderUsername: 'mike', content: 'one' }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const cutoff = new Date();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await repo.create(new Message({ id: 'ignored', roomId: 'r2', senderId: 'u1', senderUsername: 'mike', content: 'two' }));

    const history = await repo.listByRoom('r2', 50, cutoff);
    expect(history.map((m) => m.content)).toEqual(['one']);
  });

  it('deletes all messages for a room', async () => {
    await repo.create(new Message({ id: 'ignored', roomId: 'r3', senderId: 'u1', senderUsername: 'mike', content: 'hi' }));

    expect(await repo.deleteByRoom('r3')).toBe(1);
    expect(await repo.listByRoom('r3')).toEqual([]);
  });
});

describe('MongoSessionRepository', () => {
  const repo = new MongoSessionRepository();

  it('creates a session and finds the user by token', async () => {
    await repo.create('u1', 'token-1');
    expect(await repo.findByToken('token-1')).toBe('u1');
  });

  it('upserts — a second create for the same user replaces the token', async () => {
    await repo.create('u1', 'token-1');
    await repo.create('u1', 'token-2');

    expect(await repo.findByToken('token-1')).toBeNull();
    expect(await repo.findByToken('token-2')).toBe('u1');
  });

  it('revokes all sessions for a user', async () => {
    await repo.create('u1', 'token-3');
    await repo.revoke('u1');
    expect(await repo.findByToken('token-3')).toBeNull();
  });

  it('returns null for an unknown token', async () => {
    expect(await repo.findByToken('nonexistent')).toBeNull();
  });
});

describe('MongoPushSubscriptionRepository', () => {
  const repo = new MongoPushSubscriptionRepository();
  const sub = { endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } };

  it('saves and finds subscriptions by user id', async () => {
    await repo.save('u1', sub);
    expect(await repo.findByUserIds(['u1'])).toEqual([{ userId: 'u1', subscription: sub }]);
  });

  it('upserts on repeated saves for the same endpoint', async () => {
    await repo.save('u1', sub);
    await repo.save('u1', { ...sub, keys: { p256dh: 'p2', auth: 'a2' } });

    const found = await repo.findByUserIds(['u1']);
    expect(found).toHaveLength(1);
    expect(found[0]?.subscription.keys.p256dh).toBe('p2');
  });

  it('deletes a subscription', async () => {
    await repo.save('u1', sub);
    await repo.delete('u1', sub.endpoint);
    expect(await repo.findByUserIds(['u1'])).toEqual([]);
  });

  it('returns an empty array when no subscriptions match', async () => {
    expect(await repo.findByUserIds(['ghost'])).toEqual([]);
  });
});
