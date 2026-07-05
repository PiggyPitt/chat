import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createTestApp, teardownTestApp, registerApprovedUser, TestAppContext } from '../helpers/testApp.js';

let ctx: TestAppContext;
let token: string;
let uploadDir: string;

beforeAll(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'chat-upload-test-'));
  ctx = await createTestApp({ UPLOAD_DIR: uploadDir });
  ({ token } = await registerApprovedUser(ctx, 'mike'));
});

afterAll(async () => {
  await teardownTestApp(ctx);
  rmSync(uploadDir, { recursive: true, force: true });
});

describe('Upload route', () => {
  it('requires authentication', async () => {
    await request(ctx.app).post('/api/upload').expect(401);
  });

  it('rejects a request with no file attached', async () => {
    await request(ctx.app).post('/api/upload').set('Authorization', `Bearer ${token}`).expect(400);
  });

  it('rejects a disallowed mime type', async () => {
    await request(ctx.app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not an image'), { filename: 'doc.pdf', contentType: 'application/pdf' })
      .expect(422);
  });

  it('rejects a file over the multer size limit', async () => {
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 100);
    await request(ctx.app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', oversized, { filename: 'huge.png', contentType: 'image/png' })
      .expect(422);
  });

  it('uploads a valid image and returns an origin-relative publicUrl', async () => {
    const res = await request(ctx.app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake-png-bytes'), { filename: 'pic.png', contentType: 'image/png' })
      .expect(201);

    expect(res.body.publicUrl).toMatch(/^\/uploads\/.+\.png$/);
  });
});
