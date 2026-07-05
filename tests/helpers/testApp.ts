import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

export interface TestAppContext {
  app: import('express').Express;
  container: import('../../src/application/di/container.js').Container;
  mongoServer: MongoMemoryServer;
}

export async function createTestApp(envOverrides: Record<string, string> = {}): Promise<TestAppContext> {
  const mongoServer = await MongoMemoryServer.create();
  process.env.PORT = '0';
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX = '1000';
  process.env.SERVER_URL = 'http://localhost:0';
  process.env.SOCKET_PATH = '/socket.io';
  process.env.ADMIN_USERNAMES = '';
  process.env.GIPHY_API_KEY = '';
  Object.assign(process.env, envOverrides);

  await mongoose.connect(mongoServer.getUri());
  const { createApp } = await import('../../src/presentation/server/app.js');
  const { Container } = await import('../../src/application/di/container.js');
  const app = createApp();
  const container = new Container();
  return { app, container, mongoServer };
}

export async function teardownTestApp(ctx: TestAppContext): Promise<void> {
  await mongoose.disconnect();
  await ctx.mongoServer.stop();
}

// Registers a user, approves them directly through the repository (new accounts always land
// in 'pending' and there's no already-approved admin to approve them via the API), then logs
// in and returns the JWT.
export async function registerApprovedUser(
  ctx: TestAppContext,
  username: string,
  password = 'secret123'
): Promise<{ token: string; userId: string }> {
  await request(ctx.app).post('/api/auth/register').send({ username, password });
  const user = await ctx.container.userRepository.findByUsername(username);
  await ctx.container.userRepository.updateStatus(user!.id, 'approved');
  const login = await request(ctx.app).post('/api/auth/login').send({ username, password });
  return { token: login.body.token, userId: login.body.userId };
}

// Same as registerApprovedUser, but the username is temporarily added to ADMIN_USENAMES so
// AuthService.register assigns the 'admin' role (role is independent of approval status —
// approval still has to be granted separately above).
export async function registerApprovedAdmin(
  ctx: TestAppContext,
  username: string,
  password = 'secret123'
): Promise<{ token: string; userId: string }> {
  const previous = process.env.ADMIN_USERNAMES;
  process.env.ADMIN_USERNAMES = username;
  try {
    return await registerApprovedUser(ctx, username, password);
  } finally {
    process.env.ADMIN_USERNAMES = previous;
  }
}
