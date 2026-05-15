import type { Request } from 'express';
import type { UserRole } from '../domain/entities/User';

declare module 'express' {
  export interface Request {
    userId?: string;
    username?: string;
    role?: UserRole;
  }
}
