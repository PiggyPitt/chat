import { mkdir, writeFile } from 'node:fs/promises';
import { UploadImageUseCase } from '../../src/application/usecases/image/UploadImageUseCase.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'fixed-uuid')
}));

describe('UploadImageUseCase', () => {
  const useCase = new UploadImageUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects disallowed mime types', async () => {
    await expect(
      useCase.execute({ buffer: Buffer.from('x'), mimeType: 'application/pdf' })
    ).rejects.toThrow(HttpError);
  });

  it('rejects files over the 10MB limit', async () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    await expect(useCase.execute({ buffer, mimeType: 'image/png' })).rejects.toThrow(HttpError);
  });

  // Regression test: publicUrl must stay origin-relative. A previous version baked
  // SERVER_URL into an absolute URL, which broke image loading on the web client
  // whenever the app was reached via a different public domain (e.g. a second
  // Cloudflare Tunnel hostname) than the one baked into SERVER_URL — the browser's
  // img-src 'self' CSP rejected the cross-origin request.
  it('returns an origin-relative publicUrl, not an absolute SERVER_URL', async () => {
    const result = await useCase.execute({ buffer: Buffer.from('img'), mimeType: 'image/png' });

    expect(result.filename).toBe('fixed-uuid.png');
    expect(result.publicUrl).toBe('/uploads/fixed-uuid.png');
    expect(result.publicUrl.startsWith('http')).toBe(false);
  });

  it('maps each allowed mime type to the correct file extension', async () => {
    const cases: Array<[string, string]> = [
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/gif', 'gif'],
      ['image/webp', 'webp']
    ];

    for (const [mimeType, ext] of cases) {
      const result = await useCase.execute({ buffer: Buffer.from('x'), mimeType });
      expect(result.filename).toBe(`fixed-uuid.${ext}`);
    }
  });

  it('writes the buffer into the configured upload directory', async () => {
    const buffer = Buffer.from('img-bytes');
    await useCase.execute({ buffer, mimeType: 'image/png' });

    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenBuffer] = (writeFile as jest.Mock).mock.calls[0];
    expect(writtenPath).toContain('fixed-uuid.png');
    expect(writtenBuffer).toBe(buffer);
  });
});
