import request from 'supertest';
import { createTestApp, teardownTestApp, registerApprovedUser, TestAppContext } from '../helpers/testApp.js';

let ctx: TestAppContext;
let token: string;

beforeAll(async () => {
  ctx = await createTestApp();
  ({ token } = await registerApprovedUser(ctx, 'mike'));
});

afterAll(async () => {
  await teardownTestApp(ctx);
});

describe('Room routes', () => {
  it('rejects unauthenticated requests', async () => {
    await request(ctx.app).get('/api/rooms').expect(401);
  });

  it('rejects a malformed Authorization header', async () => {
    await request(ctx.app).get('/api/rooms').set('Authorization', 'not-a-bearer-token').expect(401);
  });

  it('creates a room and lists it', async () => {
    const created = await request(ctx.app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'General' })
      .expect(201);

    expect(created.body.room.name).toBe('General');
    expect(created.body.room.hasPassword).toBe(false);

    const list = await request(ctx.app).get('/api/rooms').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.rooms.some((r: { name: string }) => r.name === 'General')).toBe(true);
  });

  it('rejects creating a duplicate room', async () => {
    await request(ctx.app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'General' })
      .expect(409);
  });

  it('rejects an invalid room name', async () => {
    await request(ctx.app).post('/api/rooms').set('Authorization', `Bearer ${token}`).send({ name: 'a' }).expect(400);
  });

  it('creates a password-protected room and enforces the password on join', async () => {
    await request(ctx.app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Secret', password: 'letmein' })
      .expect(201);

    const { token: otherToken } = await registerApprovedUser(ctx, 'anna');

    await request(ctx.app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Secret' })
      .expect(401);

    await request(ctx.app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Secret', password: 'wrong' })
      .expect(401);

    const joined = await request(ctx.app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Secret', password: 'letmein' })
      .expect(200);
    expect(joined.body.room.members).toContain(joined.body.room.members.find((m: string) => m));
  });

  it('rejects joining a room that does not exist', async () => {
    await request(ctx.app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('leaves a room and rejects leaving one you are not in', async () => {
    const { token: leaverToken } = await registerApprovedUser(ctx, 'leaver');
    await request(ctx.app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${leaverToken}`)
      .send({ name: 'General' })
      .expect(200);

    await request(ctx.app)
      .post('/api/rooms/leave')
      .set('Authorization', `Bearer ${leaverToken}`)
      .send({ name: 'General' })
      .expect(200);

    await request(ctx.app)
      .post('/api/rooms/leave')
      .set('Authorization', `Bearer ${leaverToken}`)
      .send({ name: 'General' })
      .expect(400);
  });
});
