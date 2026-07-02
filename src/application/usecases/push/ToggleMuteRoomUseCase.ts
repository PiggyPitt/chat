import { IUserRepository } from '../../interfaces/repositories/IUserRepository.js';

export class ToggleMuteRoomUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, roomId: string): Promise<{ muted: boolean }> {
    const { muted } = await this.userRepo.toggleMuteRoom(userId, roomId);
    return { muted };
  }
}
