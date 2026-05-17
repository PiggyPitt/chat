import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ActivityDetector } from './ActivityDetector.js';
import { NotificationConfig } from './NotificationConfig.js';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface IncomingMessagePayload {
  message: {
    content: string;
    type?: string;
    createdAt: string;
  };
  senderId: string;
  senderUsername: string;
}

export interface NotificationServiceOptions {
  /**
   * Absolute path to an audio file.
   * Windows: must be .wav (PowerShell Media.SoundPlayer).
   * macOS / Linux: .wav, .mp3, .ogg, etc. are all supported.
   * Defaults to <cwd>/assets/notify.wav
   */
  audioPath?: string;

  /**
   * Milliseconds of stdin silence before the terminal is considered inactive.
   * Inactive terminals receive both a sound alert AND a desktop popup.
   * Defaults to 30 000 (30 s).
   */
  inactivityMs?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Single authority for all notification concerns:
 *   - popup (node-notifier desktop notification)
 *   - audio (OS-native player via child_process)
 *   - mute state (persisted per-room in ~/.terminal-chat-notifications.json)
 *   - terminal activity detection
 *   - room-scoped notification rules
 *
 * Nothing else in the codebase should trigger notifications directly.
 */
export class ManagementNotificationService {
  private readonly activity: ActivityDetector;
  private readonly config: NotificationConfig;
  private readonly audioPath: string;

  private currentRoom: string | null = null;
  private currentUserId: string | null = null;

  constructor(options: NotificationServiceOptions = {}) {
    this.activity = new ActivityDetector(options.inactivityMs ?? 30_000);
    this.config = new NotificationConfig();
    this.audioPath = options.audioPath ?? path.join(process.cwd(), 'src', 'assets', 'notify.mp3');
  }

  // ── Public interface ─────────────────────────────────────────────────────────

  /** Call whenever the user joins a room. Clears any previous subscription. */
  setCurrentRoom(room: string | null): void {
    this.currentRoom = room;
  }

  /** Call once after login so self-messages are never notified. */
  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Main entry point for incoming socket messages.
   * Applies all notification rules:
   *   1. Must be in a subscribed room
   *   2. Must not be a self-message
   *   3. Room must not be muted
   *   4. Sound always plays; popup only when terminal is inactive
   */
  handleIncomingMessage(payload: IncomingMessagePayload): void {
    if (!this.currentRoom) return;
    if (payload.senderId === this.currentUserId) return;
    if (this.config.isMuted(this.currentRoom)) return;

    const preview =
      payload.message.type === 'image'
        ? '[image]'
        : payload.message.content.slice(0, 80);

    this.dispatch(payload.senderUsername, preview);
  }

  /**
   * Toggle notifications for a room (persisted).
   * @returns true if the room is NOW muted.
   */
  toggleMute(room: string): boolean {
    return this.config.toggle(room);
  }

  isMuted(room: string): boolean {
    return this.config.isMuted(room);
  }

  // ── Dispatch ─────────────────────────────────────────────────────────────────

  private dispatch(sender: string, preview: string): void {
    this.playSound();
    if (!this.activity.isActive()) {
      this.showPopup(this.currentRoom!, sender, preview);
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────

  private playSound(): void {
    if (!existsSync(this.audioPath)) {
      // File absent → terminal bell so there is always some feedback
      process.stdout.write('\x07');
      return;
    }
    const { cmd, args } = this.buildAudioCommand();
    // windowsHide: true → CREATE_NO_WINDOW flag, prevents any console flash on Windows
    const child = execFile(cmd, args, { timeout: 8_000, windowsHide: true }, () => {});
    child.unref();
  }

  private buildAudioCommand(): { cmd: string; args: string[] } {
    if (process.platform === 'win32') {
      const ext = path.extname(this.audioPath).toLowerCase();

      if (ext === '.wav') {
        // SoundPlayer is lighter but .wav only
        const escaped = this.audioPath.replace(/\\/g, '\\\\').replace(/'/g, "''");
        return {
          cmd: 'powershell',
          args: [
            '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
            `(New-Object Media.SoundPlayer '${escaped}').PlaySync()`,
          ],
        };
      }

      // .mp3 / .ogg / etc. — WPF MediaPlayer (requires .NET PresentationCore, ships with Windows 10+)
      const fileUri = `file:///${this.audioPath.replace(/\\/g, '/')}`;
      return {
        cmd: 'powershell',
        args: [
          '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
          `Add-Type -AssemblyName PresentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([System.Uri]::new('${fileUri}')); Start-Sleep -Milliseconds 500; $p.Play(); Start-Sleep -Seconds 3; $p.Close()`,
        ],
      };
    }
    if (process.platform === 'darwin') {
      return { cmd: 'afplay', args: [this.audioPath] };
    }
    // Linux — PulseAudio; falls back silently if unavailable
    return { cmd: 'paplay', args: [this.audioPath] };
  }

  // ── Popup ─────────────────────────────────────────────────────────────────────

  /**
   * Native OS popup — zero external binaries, fully pkg-compatible.
   *   Windows : PowerShell + WinRT ToastNotification (no vendor .exe needed)
   *   macOS   : osascript
   *   Linux   : notify-send
   */
  private showPopup(room: string, sender: string, preview: string): void {
    // Strip characters that could break shell quoting
    const clean = (s: string) =>
      s.replace(/['"]/g, '').replace(/[\n\r]/g, ' ').slice(0, 100);

    const title = clean(room);
    const msg   = clean(`${sender}: ${preview}`);

    const command = this.buildPopupCommand(title, msg);
    if (!command) return;

    // windowsHide: true → CREATE_NO_WINDOW flag, prevents any console flash on Windows
    const child = execFile(command.cmd, command.args, { timeout: 5_000, windowsHide: true }, () => {});
    child.unref();
  }

  private buildPopupCommand(title: string, msg: string): { cmd: string; args: string[] } | null {
    if (process.platform === 'win32') {
      // Use -EncodedCommand (base64 UTF-16LE) to avoid all inline quoting/semicolon issues.
      // InnerText is simpler and more reliable than AppendChild + CreateTextNode.
      const script = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$nodes = $xml.GetElementsByTagName('text')
$nodes.Item(0).InnerText = '${title}'
$nodes.Item(1).InnerText = '${msg}'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Terminal Chat').Show([Windows.UI.Notifications.ToastNotification]::new($xml))
`.trim();
      const encoded = Buffer.from(script, 'utf16le').toString('base64');
      return {
        cmd: 'powershell',
        args: ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', encoded],
      };
    }
    if (process.platform === 'darwin') {
      return {
        cmd: 'osascript',
        args: ['-e', `display notification "${msg}" with title "${title}"`],
      };
    }
    // Linux — requires notify-send (libnotify); silently ignored if absent
    return { cmd: 'notify-send', args: [title, msg, '-t', '5000'] };
  }
}
