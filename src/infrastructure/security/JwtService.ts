import * as jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import { IJwtService } from '../../application/interfaces/services/IJwtService';
import { config } from '../../shared/config/index';


export class JwtService implements IJwtService {
  sign(payload: { userId: string; username: string }): string {
    const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, config.jwtSecret as Secret, options);
  }

  verify(token: string): { userId: string; username: string } {
    return jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
  }
}
