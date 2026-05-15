import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';

const execFileAsync = promisify(execFile);

export interface UploadResult {
  publicUrl: string;
  filename: string;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;

// Detect if the terminal input is a file path dragged into the terminal.
// Windows Terminal pastes the path as plain text when a file is dragged in.
export function detectDragDropPath(input: string): string | null {
  // strip surrounding quotes Windows sometimes adds
  const cleaned = input.replace(/^["']|["']$/g, '').trim();
  // must be an absolute path (Windows or Unix)
  if (!/^([A-Za-z]:[\\\/]|\/)/.test(cleaned)) return null;
  if (!IMAGE_EXT.test(cleaned)) return null;
  if (!existsSync(cleaned)) return null;
  return cleaned;
}

// Upload a file at the given path to the server
export async function uploadImageFile(filePath: string, serverUrl: string, token: string): Promise<UploadResult> {
  const cleaned = filePath.replace(/^["']|["']$/g, '').trim();
  if (!IMAGE_EXT.test(cleaned)) throw new Error('Not a supported image file (png, jpg, gif, webp)');
  if (!existsSync(cleaned)) throw new Error('File not found');

  const buffer = await readFile(cleaned);
  const filename = cleaned.replace(/\\/g, '/').split('/').pop() ?? 'image';
  return uploadBuffer(buffer, filename, serverUrl, token);
}

// Read image from clipboard (Windows only via PowerShell + WinForms) and upload
export async function captureAndUploadClipboard(serverUrl: string, token: string): Promise<UploadResult | null> {
  if (process.platform !== 'win32') return null;

  const tempPath = join(tmpdir(), `${randomUUID()}.png`);
  // single-quoted args passed to execFile as array — no shell injection possible
  const script = [
    'Add-Type -AssemblyName System.Windows.Forms',
    '$img = [System.Windows.Forms.Clipboard]::GetImage()',
    'if ($img -eq $null) { exit 1 }',
    `$img.Save('${tempPath}', [System.Drawing.Imaging.ImageFormat]::Png)`,
    'exit 0'
  ].join('; ');

  try {
    await execFileAsync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
      timeout: 6000
    });
    const buffer = await readFile(tempPath);
    return uploadBuffer(buffer, 'clipboard.png', serverUrl, token);
  } catch {
    return null;
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function uploadBuffer(buffer: Buffer, filename: string, serverUrl: string, token: string): Promise<UploadResult> {
  const form = new FormData();
  form.append('image', new Blob([new Uint8Array(buffer)]), filename);

  const res = await fetch(`${serverUrl}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  const text = await res.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Upload failed (${res.status})`);
  }
  if (!res.ok) throw new Error((body['error'] as string) ?? 'Upload failed');
  return body as unknown as UploadResult;
}
