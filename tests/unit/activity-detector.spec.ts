import { ActivityDetector } from '../../src/presentation/cli/notifications/ActivityDetector.js';

describe('ActivityDetector', () => {
  let stdinSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    // Prevent actual stdin listener registration to keep tests isolated
    stdinSpy = jest.spyOn(process.stdin, 'on').mockReturnValue(process.stdin);
  });

  afterEach(() => {
    stdinSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('isActive', () => {
    it('returns true immediately after construction', () => {
      const detector = new ActivityDetector(1000);
      expect(detector.isActive()).toBe(true);
    });

    it('returns true when elapsed time is below the threshold', () => {
      const detector = new ActivityDetector(1000);
      jest.advanceTimersByTime(999);
      expect(detector.isActive()).toBe(true);
    });

    it('returns false when the inactivity window elapses', () => {
      const detector = new ActivityDetector(1000);
      jest.advanceTimersByTime(1001);
      expect(detector.isActive()).toBe(false);
    });

    it('respects a custom inactivity threshold', () => {
      const detector = new ActivityDetector(5000);
      jest.advanceTimersByTime(4999);
      expect(detector.isActive()).toBe(true);
      jest.advanceTimersByTime(1);
      expect(detector.isActive()).toBe(false);
    });
  });

  describe('touch', () => {
    it('resets the inactivity timer', () => {
      const detector = new ActivityDetector(1000);
      jest.advanceTimersByTime(900);
      detector.touch();
      jest.advanceTimersByTime(500);
      // Only 500 ms elapsed since touch — still active
      expect(detector.isActive()).toBe(true);
    });

    it('becomes inactive again after the window elapses since last touch', () => {
      const detector = new ActivityDetector(1000);
      jest.advanceTimersByTime(900);
      detector.touch();
      jest.advanceTimersByTime(1001);
      expect(detector.isActive()).toBe(false);
    });

    it('multiple touches keep extending the active window', () => {
      const detector = new ActivityDetector(1000);
      jest.advanceTimersByTime(800);
      detector.touch();
      jest.advanceTimersByTime(800);
      detector.touch();
      jest.advanceTimersByTime(800);
      detector.touch();
      jest.advanceTimersByTime(500);
      expect(detector.isActive()).toBe(true);
    });
  });
});
