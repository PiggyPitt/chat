import fs from 'node:fs';
import { NotificationConfig } from '../../src/presentation/cli/notifications/NotificationConfig.js';

jest.mock('node:fs');

// Cast to jest.Mock to avoid strict overload-resolution issues with readFileSync
const readFileMock  = fs.readFileSync  as jest.Mock;
const writeFileMock = fs.writeFileSync as jest.Mock;

const empty = JSON.stringify({ roomNotifications: {} });

describe('NotificationConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readFileMock.mockReturnValue(empty);
    writeFileMock.mockImplementation(() => undefined);
  });

  describe('isMuted', () => {
    it('returns false when room has no entry (default enabled)', () => {
      const config = new NotificationConfig();
      expect(config.isMuted('General')).toBe(false);
    });

    it('returns false when entry is explicitly true (enabled)', () => {
      readFileMock.mockReturnValue(
        JSON.stringify({ roomNotifications: { General: true } })
      );
      const config = new NotificationConfig();
      expect(config.isMuted('General')).toBe(false);
    });

    it('returns true when entry is false (muted)', () => {
      readFileMock.mockReturnValue(
        JSON.stringify({ roomNotifications: { General: false } })
      );
      const config = new NotificationConfig();
      expect(config.isMuted('General')).toBe(true);
    });

    it('falls back to not-muted on read error', () => {
      readFileMock.mockImplementation(() => { throw new Error('ENOENT'); });
      const config = new NotificationConfig();
      expect(config.isMuted('anything')).toBe(false);
    });
  });

  describe('toggle', () => {
    it('mutes an unmuted room and returns true', () => {
      const config = new NotificationConfig();
      const nowMuted = config.toggle('General');
      expect(nowMuted).toBe(true);
      expect(config.isMuted('General')).toBe(true);
    });

    it('unmutes a muted room and returns false', () => {
      readFileMock.mockReturnValue(
        JSON.stringify({ roomNotifications: { General: false } })
      );
      const config = new NotificationConfig();
      const nowMuted = config.toggle('General');
      expect(nowMuted).toBe(false);
      expect(config.isMuted('General')).toBe(false);
    });

    it('is idempotent on consecutive toggles', () => {
      const config = new NotificationConfig();
      expect(config.toggle('General')).toBe(true);
      expect(config.toggle('General')).toBe(false);
      expect(config.toggle('General')).toBe(true);
    });

    it('persists the change to disk', () => {
      const config = new NotificationConfig();
      config.toggle('General');
      expect(writeFileMock).toHaveBeenCalledTimes(1);
    });

    it('does not cross-contaminate different rooms', () => {
      const config = new NotificationConfig();
      config.toggle('General');
      expect(config.isMuted('General')).toBe(true);
      expect(config.isMuted('gaming')).toBe(false);
    });
  });
});
