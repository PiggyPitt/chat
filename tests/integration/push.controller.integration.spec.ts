import webpush from 'web-push';
import request from 'supertest';
import { createTestApp, teardownTestApp, registerApprovedUser, TestAppContext } from '../helpers/testApp.js';

let ctx: TestAppContext;
let token: string;
let vapidKeys: { publicKey: string; privateKey: string };

beforeAll(async () => {
  vapidKeys = webpush.generateVAPIDKeys();
  ctx = await createTestApp({
    VAPID_PUBLIC_KEY: vapidKeys.publicKey,
    VAPID_PRIVATE_KEY: vapidKeys.privateKey,
    VAPID_EMAIL: 'mailto:admin@chat.app'
  });
  ({ token } = await registerApprovedUser(ctx, 'mike'));
});

afterAll(async () => {
  await teardownTestApp(ctx);
});

describe('Push routes', () => {
  it('returns the VAPID public key without auth', async () => {
    const res = await request(ctx.app).get('/api/push/vapid-key').expect(200);
    expect(res.body.publicKey).toBe(vapidKeys.publicKey);
  });

  it('rejects a subscribe payload missing keys', async () => {
    await request(ctx.app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint: 'https://push.example/1' })
      .expect(400);
  });

  it('subscribes with a valid payload', async () => {
    await request(ctx.app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } })
      .expect(201);
  });

  it('rejects an unsubscribe payload missing an endpoint', async () => {
    await request(ctx.app).delete('/api/push/subscribe').set('Authorization', `Bearer ${token}`).send({}).expect(400);
  });

  it('unsubscribes with a valid endpoint', async () => {
    await request(ctx.app)
      .delete('/api/push/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint: 'https://push.example/1' })
      .expect(200);
  });

  it('toggles the mute state for a room', async () => {
    const first = await request(ctx.app)
      .patch(`/api/push/mute/${encodeURIComponent('General')}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(typeof first.body.muted).toBe('boolean');

    const second = await request(ctx.app)
      .patch(`/api/push/mute/${encodeURIComponent('General')}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(second.body.muted).toBe(!first.body.muted);
  });

  it('requires authentication for subscribe/unsubscribe/mute', async () => {
    await request(ctx.app).post('/api/push/subscribe').send({}).expect(401);
    await request(ctx.app).delete('/api/push/subscribe').send({}).expect(401);
    await request(ctx.app).patch('/api/push/mute/General').expect(401);
  });
});
