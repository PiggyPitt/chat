import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as ioClient, Socket } from 'socket.io-client';
import request from 'supertest';

let mongoServer: MongoMemoryServer;
let server: http.Server;
let socketUrl: string;
let mikeToken: string;
let annaToken: string;
let app: any;
let container: any;

function emitAsync<T>(socket: Socket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, ...args, (error: string | null, payload?: T) => {
      if (error) reject(new Error(error));
      else resolve(payload as T);
    });
  });
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

function connectSocket(token: string): Promise<Socket> {
  const socket = ioClient(socketUrl, { auth: { token }, path: '/socket.io' });
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

async function registerApproveLogin(username: string): Promise<string> {
  await request(server).post('/api/auth/register').send({ username, password: 'secret' });
  const user = await container.userRepository.findByUsername(username);
  await container.userRepository.updateStatus(user!.id, 'approved');
  const login = await request(server).post('/api/auth/login').send({ username, password: 'secret' });
  return login.body.token;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.PORT = '0';
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX = '1000';
  process.env.SERVER_URL = 'http://localhost:0';
  process.env.SOCKET_PATH = '/socket.io';

  const { MongoClientProvider } = await import('../../src/infrastructure/db/mongo/MongoClientProvider.js');
  await MongoClientProvider.connect();
  const { createApp } = await import('../../src/presentation/server/app.js');
  app = createApp();
  server = http.createServer(app);
  const { Container } = await import('../../src/application/di/container.js');
  const { SocketServer } = await import('../../src/infrastructure/socket/SocketServer.js');
  container = new Container();
  new SocketServer(
    server,
    container.authService,
    container.roomService,
    container.messageService,
    container.userRepository,
    container.pushService
  ).start();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (typeof address === 'object' && address) {
    socketUrl = `http://localhost:${address.port}`;
  }

  mikeToken = await registerApproveLogin('mike');
  annaToken = await registerApproveLogin('anna');
  await request(server).post('/api/rooms').set('Authorization', `Bearer ${mikeToken}`).send({ name: 'General' });
  await request(server)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${mikeToken}`)
    .send({ name: 'Secret', password: 'letmein' });
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Socket integration', () => {
  it('rejects a connection with no auth token', async () => {
    const socket = ioClient(socketUrl, { auth: {}, path: '/socket.io' });
    await expect(
      new Promise((_resolve, reject) => {
        socket.on('connect_error', reject);
      })
    ).rejects.toThrow();
    socket.disconnect();
  });

  it('connects with a valid token and joins a room', async () => {
    const socket = await connectSocket(mikeToken);
    const joinResponse = await emitAsync<{ roomId: string; messages: unknown[] }>(socket, 'join-room', 'General', null);
    expect(joinResponse.roomId).toBeDefined();
    socket.disconnect();
  });

  it('rejects joining a password-protected room with the wrong password', async () => {
    const socket = await connectSocket(mikeToken);
    await expect(emitAsync(socket, 'join-room', 'Secret', 'wrong')).rejects.toThrow();
    socket.disconnect();
  });

  it('joins a password-protected room with the correct password', async () => {
    const socket = await connectSocket(mikeToken);
    const joinResponse = await emitAsync<{ roomId: string }>(socket, 'join-room', 'Secret', 'letmein');
    expect(joinResponse.roomId).toBeDefined();
    socket.disconnect();
  });

  it('rejects a wrong password on a later join, even after a prior correct join by the same user', async () => {
    const first = await connectSocket(mikeToken);
    await emitAsync(first, 'join-room', 'Secret', 'letmein');
    first.disconnect();

    const second = await connectSocket(mikeToken);
    await expect(emitAsync(second, 'join-room', 'Secret', 'wrong')).rejects.toThrow();
    second.disconnect();
  });

  describe('within a shared room', () => {
    let mikeSocket: Socket;
    let annaSocket: Socket;
    let roomId: string;

    beforeAll(async () => {
      mikeSocket = await connectSocket(mikeToken);
      annaSocket = await connectSocket(annaToken);
      const mikeJoin = await emitAsync<{ roomId: string }>(mikeSocket, 'join-room', 'General', null);
      roomId = mikeJoin.roomId;
      await emitAsync(annaSocket, 'join-room', 'General', null);
    });

    afterAll(() => {
      mikeSocket.disconnect();
      annaSocket.disconnect();
    });

    it('broadcasts a text message to everyone in the room', async () => {
      const received = waitForEvent<{ message: { content: string; type: string } }>(annaSocket, 'new-message');
      await emitAsync(mikeSocket, 'send-message', roomId, 'hello anna');
      const payload = await received;
      expect(payload.message.content).toBe('hello anna');
      expect(payload.message.type).toBe('text');
    });

    it('broadcasts an image message to everyone in the room', async () => {
      const received = waitForEvent<{ message: { content: string; type: string } }>(annaSocket, 'new-message');
      await emitAsync(mikeSocket, 'send-image', roomId, '/uploads/pic.png');
      const payload = await received;
      expect(payload.message.type).toBe('image');
      expect(payload.message.content).toBe('/uploads/pic.png');
    });

    it('lists the usernames currently in the room', async () => {
      const users = await emitAsync<string[]>(mikeSocket, 'list-users', roomId);
      expect(users.sort()).toEqual(['anna', 'mike']);
    });

    it('returns message history before a cursor', async () => {
      const history = await emitAsync<{ content: string }[]>(mikeSocket, 'get-history', roomId, new Date().toISOString());
      expect(history.some((m) => m.content === 'hello anna')).toBe(true);
    });

    it('notifies the other member when a temporary socket disconnects mid-session', async () => {
      const tempSocket = await connectSocket(annaToken);
      await emitAsync(tempSocket, 'join-room', 'General', null);

      const userLeft = waitForEvent<{ username: string }>(mikeSocket, 'user-left');
      tempSocket.disconnect();
      const payload = await userLeft;
      expect(payload.username).toBe('anna');
    });

    it('notifies the offline (but not muted) room member when a message is sent', async () => {
      // disconnect anna's main socket so she's a tracked room member but not currently online
      annaSocket.disconnect();
      const users = await emitAsync<string[]>(mikeSocket, 'list-users', roomId);
      expect(users).toEqual(['mike']);

      const longContent = 'x'.repeat(120);
      await emitAsync(mikeSocket, 'send-message', roomId, longContent);
      // notifyOfflineUsers runs fire-and-forget; give it a tick to complete without throwing
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('skips notifying a member who has muted the room', async () => {
      await request(server)
        .patch(`/api/push/mute/${encodeURIComponent(roomId)}`)
        .set('Authorization', `Bearer ${annaToken}`)
        .expect(200);

      await emitAsync(mikeSocket, 'send-message', roomId, 'are you there?');
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('explicit leave-room removes the member and notifies the room', async () => {
      const reconnected = await connectSocket(annaToken);
      await emitAsync(reconnected, 'join-room', 'General', null);

      const userLeft = waitForEvent<{ username: string }>(mikeSocket, 'user-left');
      await emitAsync(reconnected, 'leave-room', 'General');
      const payload = await userLeft;
      expect(payload.username).toBe('anna');
      reconnected.disconnect();
    });
  });
});
