import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as ioClient, Socket } from 'socket.io-client';
import request from 'supertest';

let mongoServer: MongoMemoryServer;
let server: http.Server;
let socketUrl: string;
let token: string;
let app: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.PORT = '0';
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.SERVER_URL = 'http://localhost:0';
  process.env.SOCKET_PATH = '/socket.io';

  const { MongoClientProvider } = await import('../../src/infrastructure/db/mongo/MongoClientProvider.js');
  await MongoClientProvider.connect();
  const { createApp } = await import('../../src/presentation/server/app.js');
  app = createApp();
  server = http.createServer(app);
  const { Container } = await import('../../src/application/di/container.js');
  const { SocketServer } = await import('../../src/infrastructure/socket/SocketServer.js');
  const container = new Container();
  new SocketServer(server, container.authService, container.roomService, container.messageService).start();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (typeof address === 'object' && address) {
    socketUrl = `http://localhost:${address.port}`;
  }

  await request(server).post('/api/auth/register').send({ username: 'mike', password: 'secret' });
  const login = await request(server).post('/api/auth/login').send({ username: 'mike', password: 'secret' });
  token = login.body.token;
  await request(server).post('/api/rooms').set('Authorization', `Bearer ${token}`).send({ name: 'General' });
});

afterAll(async () => {
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Socket integration', () => {
  let socket: Socket;

  it('connects with valid token and joins room', async () => {
    socket = ioClient(socketUrl, { auth: { token }, path: '/socket.io' });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });

    const joinResponse = await new Promise<{ roomId: string; messages: unknown[] }>((resolve, reject) => {
      socket.emit('join-room', 'General', null, (error: string | null, payload: unknown) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve(payload as { roomId: string; messages: unknown[] });
      });
    });

    expect(joinResponse.roomId).toBeDefined();
    socket.disconnect();
  });
});
