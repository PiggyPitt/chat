export type UserStatus = 'pending' | 'approved' | 'rejected' | 'banned';
export type UserRole = 'user' | 'admin';

export class User {
  public readonly id: string;
  public readonly username: string;
  public readonly passwordHash: string;
  public readonly createdAt: Date;
  public readonly status: UserStatus;
  public readonly role: UserRole;

  constructor(params: {
    id: string;
    username: string;
    passwordHash: string;
    createdAt?: Date;
    status?: UserStatus;
    role?: UserRole;
  }) {
    this.id = params.id;
    this.username = params.username;
    this.passwordHash = params.passwordHash;
    this.createdAt = params.createdAt ?? new Date();
    this.status = params.status ?? 'pending';
    this.role = params.role ?? 'user';
  }
}
