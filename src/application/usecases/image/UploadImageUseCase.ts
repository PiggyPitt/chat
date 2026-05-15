import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from '../../../shared/errors/HttpError.js';
import { config } from '../../../shared/config/index.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

export interface UploadImageInput {
  buffer: Buffer;
  mimeType: string;
}

export interface UploadImageResult {
  publicUrl: string;
  filename: string;
}

export class UploadImageUseCase {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = resolve(config.uploadDir);
  }

  async execute(input: UploadImageInput): Promise<UploadImageResult> {
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw new HttpError(`File type "${input.mimeType}" is not allowed`, 422);
    }
    if (input.buffer.length > MAX_BYTES) {
      throw new HttpError('File exceeds 10MB limit', 422);
    }

    const ext = MIME_TO_EXT[input.mimeType] ?? 'bin';
    const filename = `${randomUUID()}.${ext}`;
    // UUID filename only — no user-controlled path segment ever reaches disk
    const filePath = join(this.uploadDir, filename);

    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(filePath, input.buffer);

    return { filename, publicUrl: `${config.serverUrl}/uploads/${filename}` };
  }
}
