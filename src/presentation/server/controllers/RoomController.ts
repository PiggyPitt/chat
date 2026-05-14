import { Request, Response, NextFunction } from 'express';
import { CreateRoomUseCase } from '../../../application/usecases/room/CreateRoomUseCase';
import { JoinRoomUseCase } from '../../../application/usecases/room/JoinRoomUseCase';
import { LeaveRoomUseCase } from '../../../application/usecases/room/LeaveRoomUseCase';
import { ListRoomsUseCase } from '../../../application/usecases/room/ListRoomsUseCase';
import { validateRoom } from '../../../shared/validation/validators.js';

export class RoomController {
  constructor(
    private readonly listUseCase: ListRoomsUseCase,
    private readonly createUseCase: CreateRoomUseCase,
    private readonly joinUseCase: JoinRoomUseCase,
    private readonly leaveUseCase: LeaveRoomUseCase
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await this.listUseCase.execute();
      res.status(200).json({ rooms: rooms.map((r) => ({ id: r.id, name: r.name, hasPassword: r.hasPassword })) });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateRoom(req.body);
      const userId = req.userId;
      if (!userId) {
        throw new Error('Missing user context');
      }
      const room = await this.createUseCase.execute(req.body.name, userId, req.body.password);
      res.status(201).json({ room: { id: room.id, name: room.name, hasPassword: room.hasPassword, members: room.members } });
    } catch (error) {
      next(error);
    }
  }

  async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateRoom(req.body);
      const userId = req.userId;
      if (!userId) {
        throw new Error('Missing user context');
      }
      const room = await this.joinUseCase.execute(req.body.name, userId, req.body.password);
      res.status(200).json({ room: { id: room.id, name: room.name, hasPassword: room.hasPassword, members: room.members } });
    } catch (error) {
      next(error);
    }
  }

  async leave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateRoom(req.body);
      const userId = req.userId;
      if (!userId) {
        throw new Error('Missing user context');
      }
      const room = await this.leaveUseCase.execute(req.body.name, userId);
      res.status(200).json({ room });
    } catch (error) {
      next(error);
    }
  }
}
