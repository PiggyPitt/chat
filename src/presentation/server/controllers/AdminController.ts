import { Request, Response, NextFunction } from 'express';
import { ListPendingUsersUseCase } from '../../../application/usecases/admin/ListPendingUsersUseCase';
import { ApproveUserUseCase } from '../../../application/usecases/admin/ApproveUserUseCase';
import { RejectUserUseCase } from '../../../application/usecases/admin/RejectUserUseCase';
import { ClearRoomMessagesUseCase } from '../../../application/usecases/admin/ClearRoomMessagesUseCase';

export class AdminController {
  constructor(
    private readonly listPendingUseCase: ListPendingUsersUseCase,
    private readonly approveUseCase: ApproveUserUseCase,
    private readonly rejectUseCase: RejectUserUseCase,
    private readonly clearRoomMessagesUseCase: ClearRoomMessagesUseCase
  ) {}

  listPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.listPendingUseCase.execute();
      res.status(200).json({
        users: users.map((u) => ({ id: u.id, username: u.username, createdAt: u.createdAt }))
      });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const target = req.params['target'] as string;
      const user = await this.approveUseCase.execute(target);
      res.status(200).json({ userId: user.id, username: user.username, status: user.status });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const target = req.params['target'] as string;
      const user = await this.rejectUseCase.execute(target);
      res.status(200).json({ userId: user.id, username: user.username, status: user.status });
    } catch (error) {
      next(error);
    }
  };

  clearRoomMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomName = decodeURIComponent(req.params['name'] as string);
      const result = await this.clearRoomMessagesUseCase.execute(roomName);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
