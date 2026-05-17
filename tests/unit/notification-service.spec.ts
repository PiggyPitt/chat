// jest.mock calls are hoisted above imports — order matters here
jest.mock('node:child_process', () => ({
  execFile: jest.fn(() => ({ unref: jest.fn() })),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(() => true),
}));

jest.mock('../../src/presentation/cli/notifications/NotificationConfig.js');
jest.mock('../../src/presentation/cli/notifications/ActivityDetector.js');

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { NotificationConfig } from '../../src/presentation/cli/notifications/NotificationConfig.js';
import { ActivityDetector } from '../../src/presentation/cli/notifications/ActivityDetector.js';
import {
  ManagementNotificationService,
  type IncomingMessagePayload,
} from '../../src/presentation/cli/notifications/ManagementNotificationService.js';

// ── Typed mock handles ────────────────────────────────────────────────────────

const execFileMock = execFile as jest.MockedFunction<typeof execFile>;
const existsSyncMock = existsSync as jest.MockedFunction<typeof existsSync>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePayload(
  senderId: string,
  content: string,
  type?: 'text' | 'image'
): IncomingMessagePayload {
  return {
    message: { content, type, createdAt: new Date().toISOString() },
    senderId,
    senderUsername: senderId,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ManagementNotificationService', () => {
  let service: ManagementNotificationService;
  let isMuted: jest.Mock;
  let toggle: jest.Mock;
  let isActive: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Fresh mock implementations per test so each test controls its own state
    isMuted = jest.fn().mockReturnValue(false);
    toggle  = jest.fn().mockReturnValue(true);
    isActive = jest.fn().mockReturnValue(true); // terminal active by default

    (NotificationConfig as jest.Mock).mockImplementation(() => ({ isMuted, toggle }));
    (ActivityDetector  as jest.Mock).mockImplementation(() => ({ isActive, touch: jest.fn() }));

    execFileMock.mockReturnValue({ unref: jest.fn() } as any);
    existsSyncMock.mockReturnValue(true);

    service = new ManagementNotificationService();
    service.setCurrentUserId('self-id');
  });

  // ── handleIncomingMessage ──────────────────────────────────────────────────

  describe('handleIncomingMessage', () => {
    it('does nothing when not subscribed to any room', () => {
      // currentRoom is null — no setCurrentRoom call
      service.handleIncomingMessage(makePayload('other', 'hello'));
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('does nothing for self-messages', () => {
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('self-id', 'echo'));
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('does nothing when the current room is muted', () => {
      isMuted.mockReturnValue(true);
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('other', 'hello'));
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('plays sound only when terminal is active', () => {
      isActive.mockReturnValue(true);
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('other', 'hello'));
      // one execFile call = audio only, no popup
      expect(execFileMock).toHaveBeenCalledTimes(1);
    });

    it('plays sound AND shows popup when terminal is inactive', () => {
      isActive.mockReturnValue(false);
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('other', 'hello'));
      // two execFile calls = audio + popup
      expect(execFileMock).toHaveBeenCalledTimes(2);
    });

    it('falls back to terminal bell when audio file does not exist', () => {
      existsSyncMock.mockReturnValue(false);
      const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('other', 'hello'));
      expect(writeSpy).toHaveBeenCalledWith('\x07');
      expect(execFileMock).not.toHaveBeenCalled(); // no audio process spawned
      writeSpy.mockRestore();
    });

    it('uses [image] as preview for image messages', () => {
      isActive.mockReturnValue(false);
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('other', 'https://cdn/img.png', 'image'));
      // popup call is execFile call index 1 (index 0 = audio)
      // On Windows the script is base64 UTF-16LE encoded via -EncodedCommand
      const popupArgs = execFileMock.mock.calls[1]?.[1] as string[] | undefined;
      expect(popupArgs).toBeDefined();
      const encodedIdx = popupArgs!.indexOf('-EncodedCommand');
      const encoded = popupArgs![encodedIdx + 1] ?? '';
      const decoded = Buffer.from(encoded, 'base64').toString('utf16le');
      expect(decoded).toContain('[image]');
    });

    it('stops dispatching after setCurrentRoom(null)', () => {
      service.setCurrentRoom('General');
      service.handleIncomingMessage(makePayload('other', 'first'));
      expect(execFileMock).toHaveBeenCalledTimes(1);

      service.setCurrentRoom(null);
      service.handleIncomingMessage(makePayload('other', 'second'));
      // count must not increase
      expect(execFileMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── toggleMute ─────────────────────────────────────────────────────────────

  describe('toggleMute', () => {
    it('delegates to NotificationConfig.toggle and returns its result', () => {
      toggle.mockReturnValue(true);
      expect(service.toggleMute('General')).toBe(true);
      expect(toggle).toHaveBeenCalledWith('General');
    });

    it('returns false when config reports the room is now unmuted', () => {
      toggle.mockReturnValue(false);
      expect(service.toggleMute('dbd')).toBe(false);
    });
  });

  // ── isMuted ────────────────────────────────────────────────────────────────

  describe('isMuted', () => {
    it('delegates to NotificationConfig.isMuted', () => {
      isMuted.mockReturnValue(true);
      expect(service.isMuted('General')).toBe(true);
      expect(isMuted).toHaveBeenCalledWith('General');
    });

    it('returns false for a room that is not muted', () => {
      isMuted.mockReturnValue(false);
      expect(service.isMuted('dbd')).toBe(false);
    });
  });
});
