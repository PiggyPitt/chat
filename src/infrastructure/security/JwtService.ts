import * as jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import { IJwtService, JwtPayload } from '../../application/interfaces/services/IJwtService';
import { config } from '../../shared/config/index';

export class JwtService implements IJwtService {
  sign(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, config.jwtSecret as Secret, options);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  }
}
