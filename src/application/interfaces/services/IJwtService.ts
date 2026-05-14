export interface IJwtService {
  sign(payload: { userId: string; username: string }): string;
  verify(token: string): { userId: string; username: string };
}
