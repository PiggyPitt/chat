export class Room {
  public readonly id: string;
  public readonly name: string;
  public readonly createdBy: string;
  public readonly members: string[];
  public readonly createdAt: Date;
  public readonly passwordHash?: string;

  constructor(params: { id: string; name: string; createdBy: string; members?: string[]; createdAt?: Date; passwordHash?: string }) {
    this.id = params.id;
    this.name = params.name;
    this.createdBy = params.createdBy;
    this.members = params.members ?? [];
    this.createdAt = params.createdAt ?? new Date();
    this.passwordHash = params.passwordHash;
  }

  get hasPassword(): boolean {
    return !!this.passwordHash;
  }
}
