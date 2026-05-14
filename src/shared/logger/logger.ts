export class Logger {
  static info(message: string, ...meta: unknown[]): void {
    console.info(`[INFO] ${message}`, ...meta);
  }

  static warn(message: string, ...meta: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...meta);
  }

  static error(message: string, ...meta: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...meta);
  }
}
