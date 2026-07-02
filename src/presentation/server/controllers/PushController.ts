import { Request, Response, NextFunction } from 'express';
import { SubscribePushUseCase } from '../../../application/usecases/push/SubscribePushUseCase.js';
import { UnsubscribePushUseCase } from '../../../application/usecases/push/UnsubscribePushUseCase.js';
import { ToggleMuteRoomUseCase } from '../../../application/usecases/push/ToggleMuteRoomUseCase.js';
import { PushService } from '../../../infrastructure/services/PushService.js';
import { HttpError } from '../../../shared/errors/HttpError.js';

export class PushController {
  constructor(
    private readonly subscribeUseCase: SubscribePushUseCase,
    private readonly unsubscribeUseCase: UnsubscribePushUseCase,
    private readonly toggleMuteUseCase: ToggleMuteRoomUseCase,
    private readonly pushService: PushService
  ) {}

  getVapidKey = (_req: Request, res: Response): void => {
    res.json({ publicKey: this.pushService.vapidPublicKey });
  };

  subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
      if (!endpoint || !keys?.p256dh || !keys?.auth) throw new HttpError('Invalid subscription', 400);
      await this.subscribeUseCase.execute(req.userId!, { endpoint, keys });
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  unsubscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { endpoint } = req.body as { endpoint: string };
      if (!endpoint) throw new HttpError('endpoint required', 400);
      await this.unsubscribeUseCase.execute(req.userId!, endpoint);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  toggleMute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = decodeURIComponent(req.params['roomId'] as string);
      const result = await this.toggleMuteUseCase.execute(req.userId!, roomId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
