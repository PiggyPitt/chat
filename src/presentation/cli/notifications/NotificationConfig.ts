import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

interface ConfigData {
  roomNotifications: Record<string, boolean>;
}

// Persisted in user home dir so mute state survives restarts
const CONFIG_FILE = path.join(os.homedir(), '.terminal-chat-notifications.json');

export class NotificationConfig {
  private data: ConfigData;

  constructor() {
    this.data = this.read();
  }

  private read(): ConfigData {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as ConfigData;
    } catch {
      return { roomNotifications: {} };
    }
  }

  private persist(): void {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch { /* best-effort — non-critical */ }
  }

  /**
   * Storage convention: true = notifications enabled, false = muted, undefined = default (enabled).
   * isMuted returns true only when explicitly set to false.
   */
  isMuted(room: string): boolean {
    return this.data.roomNotifications[room] === false;
  }

  /**
   * Toggles mute for a room and persists the change.
   * @returns true if the room is NOW muted (notifications disabled).
   */
  toggle(room: string): boolean {
    const nowMuted = !this.isMuted(room);
    // Store: true = enabled, false = muted
    this.data.roomNotifications[room] = !nowMuted;
    this.persist();
    return nowMuted;
  }
}
