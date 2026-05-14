import { AuthService } from '../../src/infrastructure/services/AuthService.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';

describe('AuthService', () => {
  const validUser = { id: 'u1', username: 'mike', passwordHash: '$2b$10$fakehash' };
  const userRepository = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    create: jest.fn()
  };
  const sessionRepository = {
    create: jest.fn(),
    revoke: jest.fn(),
    findByToken: jest.fn()
  };
  const hashingService = {
    hash: jest.fn(),
    verify: jest.fn()
  };
  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn()
  };
  const authService = new AuthService(userRepository as any, sessionRepository as any, hashingService as any, jwtService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user', async () => {
    userRepository.findByUsername.mockResolvedValue(null);
    hashingService.hash.mockResolvedValue('hashed');
    userRepository.create.mockImplementation(async (user) => user);

    const result = await authService.register('mike', 'password');

    expect(result.username).toBe('mike');
    expect(hashingService.hash).toHaveBeenCalledWith('password');
    expect(userRepository.create).toHaveBeenCalled();
  });

  it('throws when username already exists', async () => {
    userRepository.findByUsername.mockResolvedValue(validUser);

    await expect(authService.register('mike', 'password')).rejects.toThrow(HttpError);
  });

  it('logs in with valid credentials', async () => {
    userRepository.findByUsername.mockResolvedValue(validUser);
    hashingService.verify.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('token');

    const result = await authService.login('mike', 'password');

    expect(result.token).toBe('token');
    expect(sessionRepository.create).toHaveBeenCalledWith('u1', 'token');
  });

  it('throws invalid credentials when password is wrong', async () => {
    userRepository.findByUsername.mockResolvedValue(validUser);
    hashingService.verify.mockResolvedValue(false);

    await expect(authService.login('mike', 'wrong')).rejects.toThrow(HttpError);
  });

  it('verifies token and session', async () => {
    jwtService.verify.mockReturnValue({ userId: 'u1', username: 'mike' });
    sessionRepository.findByToken.mockResolvedValue('u1');

    const result = await authService.verifyToken('token');

    expect(result.userId).toBe('u1');
    expect(result.username).toBe('mike');
  });

  it('throws when token session is invalid', async () => {
    jwtService.verify.mockReturnValue({ userId: 'u1', username: 'mike' });
    sessionRepository.findByToken.mockResolvedValue(null);

    await expect(authService.verifyToken('token')).rejects.toThrow(HttpError);
  });
});
