import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

let app: any;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.PORT = '4000';
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.SERVER_URL = 'http://localhost:4000';
  await mongoose.connect(mongoServer.getUri());
  const { createApp } = await import('../../src/presentation/server/app.js');
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth integration', () => {
  it('registers and logs in a user', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ username: 'mike', password: 'secret' })
      .expect(201);

    expect(registerResponse.body.username).toBe('mike');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'mike', password: 'secret' })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body.username).toBe('mike');
  });
});
