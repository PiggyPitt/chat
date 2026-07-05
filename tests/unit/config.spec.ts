describe('shared/config', () => {
  it('throws when a required environment variable is missing', () => {
    const saved = process.env.JWT_SECRET;
    // Empty string, not delete — dotenv.config() only fills in keys that are entirely
    // absent from process.env, so a delete would just get silently refilled from .env.
    process.env.JWT_SECRET = '';
    jest.resetModules();

    expect(() => require('../../src/shared/config/index.js')).toThrow(
      'Missing environment variable: JWT_SECRET'
    );

    process.env.JWT_SECRET = saved;
    jest.resetModules();
  });
});
