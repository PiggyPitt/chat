import { validateLogin, validateRegister, validateRoom, validateMessage } from '../../src/shared/validation/validators.js';
import { AppError } from '../../src/shared/errors/AppError.js';

describe('Validators', () => {
  it('accepts valid register payload', () => {
    expect(() => validateRegister({ username: 'mike', password: 'secret' })).not.toThrow();
  });

  it('rejects short username', () => {
    expect(() => validateRegister({ username: 'a', password: 'secret' })).toThrow(AppError);
  });

  it('accepts valid room payload', () => {
    expect(() => validateRoom({ name: 'General' })).not.toThrow();
  });

  it('rejects empty message content', () => {
    expect(() => validateMessage({ roomId: 'room1', content: '' })).toThrow(AppError);
  });
});
