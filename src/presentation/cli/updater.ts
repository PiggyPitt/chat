import { existsSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { VERSION } from '../../version.js';

const GITHUB_REPO = 'PiggyPitt/chat';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface GitHubRelease {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
}

function semverGt(a: string, b: string): boolean {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return false;
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'chat-cli-updater' },
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  writeFileSync(dest, Buffer.from(buffer));
}

export async function checkAndUpdate(): Promise<void> {
  const exePath = process.execPath;

  // Clean up leftover .old file from previous update
  const oldPath = exePath + '.old';
  if (existsSync(oldPath)) {
    try { unlinkSync(oldPath); } catch { /* ignore if still locked */ }
  }

  try {
    const res = await fetch(API_URL, {
      headers: { 'User-Agent': 'chat-cli-updater' },
    });
    if (!res.ok) return;

    const release = await res.json() as GitHubRelease;
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (!semverGt(latestVersion, VERSION)) return;

    const asset = release.assets.find(a => a.name === 'chat-cli.exe');
    if (!asset) return;

    console.log(`\n  Update available: v${VERSION} → v${latestVersion}`);
    console.log('  Downloading update...');

    const newPath = exePath + '.new';
    await downloadToFile(asset.browser_download_url, newPath);

    // Windows: rename running exe to .old (allowed), move new exe into place
    renameSync(exePath, oldPath);
    renameSync(newPath, exePath);

    console.log('  Update installed. Restarting...\n');

    const child = spawn(exePath, process.argv.slice(2), {
      detached: true,
      stdio: 'inherit',
    });
    child.unref();
    process.exit(0);

  } catch {
    // Silent — don't block startup on network/update errors
  }
}
