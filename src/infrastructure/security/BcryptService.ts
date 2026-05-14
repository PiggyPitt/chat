import bcrypt from 'bcrypt';
import { IPasswordHashingService } from '../../application/interfaces/services/IPasswordHashingService';

export class BcryptService implements IPasswordHashingService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
