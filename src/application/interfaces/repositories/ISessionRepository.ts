export interface ISessionRepository {
  create(userId: string, token: string): Promise<void>;
  revoke(userId: string): Promise<void>;
  findByToken(token: string): Promise<string | null>;
}
