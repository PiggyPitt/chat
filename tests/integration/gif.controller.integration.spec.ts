import request from 'supertest';
import { createTestApp, teardownTestApp, registerApprovedUser, TestAppContext } from '../helpers/testApp.js';

let ctx: TestAppContext;
let token: string;
const originalFetch = global.fetch;

beforeAll(async () => {
  ctx = await createTestApp({ GIPHY_API_KEY: 'test-key' });
  ({ token } = await registerApprovedUser(ctx, 'mike'));
});

afterAll(async () => {
  global.fetch = originalFetch;
  await teardownTestApp(ctx);
});

describe('GIF routes', () => {
  it('requires authentication', async () => {
    await request(ctx.app).get('/api/gif/search?q=cats').expect(401);
  });

  it('rejects a search with no query parameter', async () => {
    await request(ctx.app).get('/api/gif/search').set('Authorization', `Bearer ${token}`).expect(400);
  });

  it('searches gifs through the Giphy API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'g1',
            images: {
              original: { url: 'https://media.giphy.com/g1.gif', width: '200', height: '100' },
              fixed_width: { url: 'https://media.giphy.com/g1-small.gif', width: '150', height: '75' }
            }
          }
        ]
      })
    }) as unknown as typeof fetch;

    const res = await request(ctx.app).get('/api/gif/search?q=cats').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].id).toBe('g1');
  });

  it('returns trending gifs', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch;

    const res = await request(ctx.app).get('/api/gif/trending').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.results).toEqual([]);
  });

  it('returns 502 when the upstream Giphy request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    await request(ctx.app).get('/api/gif/trending').set('Authorization', `Bearer ${token}`).expect(502);
  });
});
