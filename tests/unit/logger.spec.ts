import { Logger } from '../../src/shared/logger/logger.js';

describe('Logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prefixes info messages', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    Logger.info('hello', { extra: 1 });
    expect(spy).toHaveBeenCalledWith('[INFO] hello', { extra: 1 });
  });

  it('prefixes warn messages', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Logger.warn('careful');
    expect(spy).toHaveBeenCalledWith('[WARN] careful');
  });

  it('prefixes error messages', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Logger.error('boom');
    expect(spy).toHaveBeenCalledWith('[ERROR] boom');
  });
});
