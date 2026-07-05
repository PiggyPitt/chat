import request from 'supertest';
import {
  createTestApp,
  teardownTestApp,
  registerApprovedUser,
  registerApprovedAdmin,
  TestAppContext
} from '../helpers/testApp.js';

let ctx: TestAppContext;
let adminToken: string;
let userToken: string;

beforeAll(async () => {
  ctx = await createTestApp();
  ({ token: adminToken } = await registerApprovedAdmin(ctx, 'root'));
  ({ token: userToken } = await registerApprovedUser(ctx, 'mike'));
});

afterAll(async () => {
  await teardownTestApp(ctx);
});

describe('Admin routes', () => {
  it('rejects non-admin users', async () => {
    await request(ctx.app).get('/api/admin/pending').set('Authorization', `Bearer ${userToken}`).expect(403);
  });

  it('rejects unauthenticated requests', async () => {
    await request(ctx.app).get('/api/admin/pending').expect(401);
  });

  it('lists pending users', async () => {
    await request(ctx.app).post('/api/auth/register').send({ username: 'pending-guy', password: 'secret123' });

    const res = await request(ctx.app).get('/api/admin/pending').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.users.some((u: { username: string }) => u.username === 'pending-guy')).toBe(true);
  });

  it('approves a pending user by username', async () => {
    const res = await request(ctx.app)
      .post('/api/admin/approve/pending-guy')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.status).toBe('approved');
  });

  it('returns 404 approving a user that does not exist', async () => {
    await request(ctx.app).post('/api/admin/approve/ghost').set('Authorization', `Bearer ${adminToken}`).expect(404);
  });

  it('rejects a user by username', async () => {
    await request(ctx.app).post('/api/auth/register').send({ username: 'baddie', password: 'secret123' });

    const res = await request(ctx.app)
      .post('/api/admin/reject/baddie')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.status).toBe('rejected');
  });

  it('returns 404 rejecting a user that does not exist', async () => {
    await request(ctx.app).post('/api/admin/reject/ghost').set('Authorization', `Bearer ${adminToken}`).expect(404);
  });

  it('clears a room\'s messages', async () => {
    await request(ctx.app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'ToClear' })
      .expect(201);

    const res = await request(ctx.app)
      .delete(`/api/admin/rooms/${encodeURIComponent('ToClear')}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.roomName).toBe('ToClear');
    expect(res.body.deletedCount).toBe(0);
  });

  it('returns 404 clearing messages for a room that does not exist', async () => {
    await request(ctx.app)
      .delete(`/api/admin/rooms/${encodeURIComponent('Ghost')}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
