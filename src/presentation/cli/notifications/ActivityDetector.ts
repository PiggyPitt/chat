/**
 * Lightweight terminal activity detector.
 *
 * Tracks the last time the user pressed a key on stdin. If no input has been
 * received within `inactivityMs`, the terminal is considered inactive and
 * ManagementNotificationService will show a desktop popup in addition to the
 * audio alert.
 */
export class ActivityDetector {
  private lastInputAt = Date.now();

  constructor(private readonly inactivityMs = 30_000) {
    // 'data' fires on every keystroke while readline holds stdin in raw/flowing mode
    process.stdin.on('data', () => {
      this.lastInputAt = Date.now();
    });
  }

  /** Manually mark the user as active (e.g. after submitting a command). */
  touch(): void {
    this.lastInputAt = Date.now();
  }

  /** Returns true when the user has typed within the inactivity window. */
  isActive(): boolean {
    return Date.now() - this.lastInputAt < this.inactivityMs;
  }
}
