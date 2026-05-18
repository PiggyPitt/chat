import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execFileSync, spawn } from 'child_process';

const APP_NAME = 'chat-cli';
const EXE_NAME = 'chat-cli.exe';

/**
 * Detects whether the process is running inside a pkg-bundled executable.
 * pkg sets `process.pkg` at runtime; tsx/node do not.
 */
function isPackagedExecutable(): boolean {
  return typeof (process as unknown as { pkg?: unknown }).pkg !== 'undefined';
}

/**
 * Self-installing bootstrap for the Windows portable executable.
 *
 * On first launch from any directory (e.g. Downloads), the service:
 *  1. Copies itself to %LOCALAPPDATA%\chat-cli\chat-cli.exe
 *  2. Creates auxiliary directories (assets, logs, config)
 *  3. Adds the install directory to the USER PATH via PowerShell
 *  4. Relaunches the installed copy and exits the bootstrap process
 *
 * Subsequent launches from the install location are detected and skipped
 * so normal startup proceeds without overhead.
 */
export class InstallerBootstrapService {
  /** %LOCALAPPDATA%\chat-cli — executable lives here */
  private readonly installDir: string;
  /** %APPDATA%\chat-cli — user config lives here */
  private readonly configDir: string;
  /** Full path to the installed executable */
  private readonly installedExePath: string;
  /**
   * Marker file written once during installation.
   * Existence of this file is the sole signal that installation has completed.
   * Avoids relying on process.execPath which pkg may resolve differently
   * from the actual .exe path (e.g. to an embedded Node.js runtime path).
   */
  private readonly markerPath: string;

  private constructor(localAppData: string, appData: string) {
    this.installDir = join(localAppData, APP_NAME);
    this.configDir = join(appData, APP_NAME);
    this.installedExePath = join(this.installDir, EXE_NAME);
    this.markerPath = join(this.installDir, '.installed');
  }

  // ──────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────

  /**
   * Entry point. Call once at the very top of the CLI entry file.
   * Guards against dev mode, non-Windows, and already-installed state.
   * If installation is needed it will NEVER return — it exits after relaunch.
   */
  static runIfNeeded(): void {
    if (process.platform !== 'win32') return;
    if (!isPackagedExecutable()) return;         // running via tsx / node — skip

    const { LOCALAPPDATA, APPDATA } = process.env;
    if (!LOCALAPPDATA || !APPDATA) {
      console.error('  [installer] LOCALAPPDATA or APPDATA is not set — cannot install.');
      return;
    }

    const service = new InstallerBootstrapService(LOCALAPPDATA, APPDATA);
    if (service.isInstalled()) return;           // already running from install dir

    service.install();
    // install() calls relaunch() which exits — this line is unreachable
  }

  // ──────────────────────────────────────────────
  // Detection
  // ──────────────────────────────────────────────

  /**
   * True when both the marker file AND the executable exist at the install location.
   * Marker-only check could pass after a corrupt/partial install (e.g. marker written
   * but exe then deleted). Requiring the exe guards against that case.
   */
  isInstalled(): boolean {
    return existsSync(this.markerPath) && existsSync(this.installedExePath);
  }

  // ──────────────────────────────────────────────
  // Installation steps
  // ──────────────────────────────────────────────

  private install(): void {
    console.log(`\n  Installing ${APP_NAME}...\n`);

    this.createDirectories();
    this.copyExecutable();   // marker is written here, after a successful copy
    this.addToUserPath();
    this.relaunch();
  }

  /**
   * Creates the full directory tree required by the application.
   * All mkdirSync calls are idempotent (recursive: true).
   * Does NOT write the marker here — the marker is only written after a
   * successful exe copy, so a failed copy never leaves a stale marker.
   */
  private createDirectories(): void {
    const dirs: string[] = [
      this.installDir,
      join(this.installDir, 'assets'),
      join(this.installDir, 'logs'),
      this.configDir,
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    console.log(`  Created directories under ${this.installDir}`);
  }

  /**
   * Copies the running executable to the install location, then writes the
   * marker file.  Marker is written last so a failed copy never produces a
   * stale marker that silently bypasses future installation attempts.
   *
   * EC: guards src === dest — if pkg resolves process.execPath to the same
   * string as installedExePath, copyFileSync would truncate the running exe.
   */
  private copyExecutable(): void {
    const src = process.execPath;
    const dest = this.installedExePath;

    if (src.toLowerCase() !== dest.toLowerCase()) {
      try {
        copyFileSync(src, dest);
      } catch (err) {
        throw new Error(`Failed to copy executable: ${(err as Error).message}`);
      }
    }

    writeFileSync(this.markerPath, new Date().toISOString(), 'utf8');
    console.log(`  Installed: ${dest}`);
  }

  /**
   * Adds the install directory to the Windows USER PATH via PowerShell.
   *
   * Requirements met:
   *  - PowerShell 5.1 compatible (no ?? operator, no ternary)
   *  - Modifies USER path only — no admin privileges needed
   *  - Idempotent — skips if already present
   *  - Handles NULL initial PATH gracefully
   */
  private addToUserPath(): void {
    // Single-quote the path; escape any embedded single quotes by doubling them.
    const escapedDir = this.installDir.replace(/'/g, "''");

    const script = [
      `$dir = '${escapedDir}'`,
      `$raw = [Environment]::GetEnvironmentVariable('PATH', 'User')`,
      `if ($null -eq $raw) { $raw = '' }`,
      `$parts = $raw -split ';' | Where-Object { $_ -ne '' }`,
      `if ($parts -notcontains $dir) {`,
      `  $new = ($parts + $dir | Where-Object { $_ -ne '' }) -join ';'`,
      `  [Environment]::SetEnvironmentVariable('PATH', $new, 'User')`,
      `  Write-Output 'PATH_UPDATED'`,
      `} else {`,
      `  Write-Output 'PATH_EXISTS'`,
      `}`,
    ].join('; ');

    try {
      const out = execFileSync('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-Command', script,
      ], { encoding: 'utf8' }).trim();

      if (out === 'PATH_UPDATED') {
        console.log('  Added to USER PATH.');
        console.log(`  Restart your terminal, then type "${APP_NAME}" to launch.`);
      } else {
        console.log('  PATH already configured.');
      }
    } catch {
      // Non-fatal: the app still runs, the user just has to launch by full path
      console.error('  Warning: could not update PATH automatically.');
      console.error(`  Add manually: ${this.installDir}`);
    }
  }

  /**
   * Spawns the installed executable as a detached process that inherits
   * the current console, then exits the bootstrap process cleanly.
   *
   * detached + stdio:'inherit' + unref() matches the pattern used by
   * the updater (updater.ts) — it keeps the console attached while
   * allowing the parent to exit independently.
   */
  private relaunch(): void {
    console.log('\n  Launching...\n');

    let child;
    try {
      child = spawn(this.installedExePath, process.argv.slice(2), {
        detached: true,
        stdio: 'inherit',
        windowsHide: false,
      });
    } catch (err) {
      throw new Error(`Failed to launch installed executable: ${(err as Error).message}`);
    }

    child.unref();
    process.exit(0);
  }
}
