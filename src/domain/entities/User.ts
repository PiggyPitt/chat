export class User {
  public readonly id: string;
  public readonly username: string;
  public readonly passwordHash: string;
  public readonly createdAt: Date;

  constructor(params: { id: string; username: string; passwordHash: string; createdAt?: Date }) {
    this.id = params.id;
    this.username = params.username;
    this.passwordHash = params.passwordHash;
    this.createdAt = params.createdAt ?? new Date();
  }
}
