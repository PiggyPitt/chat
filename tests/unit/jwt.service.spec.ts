import { JwtService } from '../../src/infrastructure/security/JwtService.js';

describe('JwtService', () => {
  const service = new JwtService();

  it('signs and verifies a round trip', () => {
    const token = service.sign({ userId: 'u1', username: 'mike', role: 'user' });
    const payload = service.verify(token);

    expect(payload).toMatchObject({ userId: 'u1', username: 'mike', role: 'user' });
  });

  it('throws for a malformed token', () => {
    expect(() => service.verify('not-a-real-token')).toThrow();
  });
});
