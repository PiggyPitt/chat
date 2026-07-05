import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

let app: any;
let container: any;
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
  const { Container } = await import('../../src/application/di/container.js');
  app = createApp();
  container = new Container();
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

    // New registrations land in 'pending' and can't log in until an admin approves them —
    // approve directly through the repository since no approved admin exists yet to do it
    // via the API.
    const registered = await container.userRepository.findByUsername('mike');
    await container.userRepository.updateStatus(registered.id, 'approved');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'mike', password: 'secret' })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body.username).toBe('mike');
  });

  it('rejects registering a username that is already taken', async () => {
    await request(app).post('/api/auth/register').send({ username: 'dup', password: 'secret' }).expect(201);
    await request(app).post('/api/auth/register').send({ username: 'dup', password: 'secret' }).expect(409);
  });

  it('rejects a login with the wrong password', async () => {
    await request(app).post('/api/auth/register').send({ username: 'wrongpw', password: 'secret' });
    const user = await container.userRepository.findByUsername('wrongpw');
    await container.userRepository.updateStatus(user.id, 'approved');

    await request(app).post('/api/auth/login').send({ username: 'wrongpw', password: 'nope' }).expect(401);
  });

  it('rejects an invalid register payload', async () => {
    await request(app).post('/api/auth/register').send({ username: 'a', password: 'secret' }).expect(400);
  });

  it('rejects a malformed Authorization header with an empty bearer token', async () => {
    await request(app).get('/api/rooms').set('Authorization', 'Bearer ').expect(401);
  });
});
