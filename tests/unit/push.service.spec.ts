import webpush from 'web-push';

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn()
  }
}));

jest.mock('../../src/shared/config/index.js', () => ({
  config: {
    vapidPublicKey: 'pub-key',
    vapidPrivateKey: 'priv-key',
    vapidEmail: 'mailto:admin@chat.app'
  }
}));

import { PushService } from '../../src/infrastructure/services/PushService.js';

describe('PushService (VAPID configured)', () => {
  function makePushRepo() {
    return {
      findByUserIds: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest.fn()
    };
  }
  const payload = { title: 'New message', body: 'hi', roomId: 'r1', roomName: 'General' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets VAPID details on construction and exposes the public key', () => {
    const pushRepo = makePushRepo();
    const service = new PushService(pushRepo as any);
    expect(webpush.setVapidDetails).toHaveBeenCalledWith('mailto:admin@chat.app', 'pub-key', 'priv-key');
    expect(service.vapidPublicKey).toBe('pub-key');
  });

  it('does nothing when there are no target users', async () => {
    const pushRepo = makePushRepo();
    const service = new PushService(pushRepo as any);
    await service.sendToUsers([], payload);
    expect(pushRepo.findByUserIds).not.toHaveBeenCalled();
  });

  it('sends a notification to every subscription found', async () => {
    const pushRepo = makePushRepo();
    pushRepo.findByUserIds.mockResolvedValue([
      { userId: 'u1', subscription: { endpoint: 'https://push.example/1' } }
    ]);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    const service = new PushService(pushRepo as any);
    await service.sendToUsers(['u1'], payload);

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: 'https://push.example/1' },
      JSON.stringify(payload)
    );
    expect(pushRepo.delete).not.toHaveBeenCalled();
  });

  it('deletes the subscription when the push endpoint reports it is gone (410)', async () => {
    const pushRepo = makePushRepo();
    pushRepo.findByUserIds.mockResolvedValue([
      { userId: 'u1', subscription: { endpoint: 'https://push.example/1' } }
    ]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue({ statusCode: 410 });

    const service = new PushService(pushRepo as any);
    await service.sendToUsers(['u1'], payload);

    expect(pushRepo.delete).toHaveBeenCalledWith('u1', 'https://push.example/1');
  });

  it('deletes the subscription on a 404 as well', async () => {
    const pushRepo = makePushRepo();
    pushRepo.findByUserIds.mockResolvedValue([
      { userId: 'u1', subscription: { endpoint: 'https://push.example/1' } }
    ]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue({ statusCode: 404 });

    const service = new PushService(pushRepo as any);
    await service.sendToUsers(['u1'], payload);

    expect(pushRepo.delete).toHaveBeenCalledWith('u1', 'https://push.example/1');
  });

  it('swallows unrelated send failures without deleting the subscription', async () => {
    const pushRepo = makePushRepo();
    pushRepo.findByUserIds.mockResolvedValue([
      { userId: 'u1', subscription: { endpoint: 'https://push.example/1' } }
    ]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue(new Error('network blip'));

    const service = new PushService(pushRepo as any);
    await expect(service.sendToUsers(['u1'], payload)).resolves.toBeUndefined();
    expect(pushRepo.delete).not.toHaveBeenCalled();
  });
});

describe('PushService (VAPID not configured)', () => {
  it('never calls webpush and no-ops sendToUsers', async () => {
    jest.resetModules();
    jest.doMock('../../src/shared/config/index.js', () => ({
      config: { vapidPublicKey: '', vapidPrivateKey: '', vapidEmail: 'mailto:admin@chat.app' }
    }));
    const webpushModule = (await import('web-push')).default;
    const { PushService: UnconfiguredPushService } = await import('../../src/infrastructure/services/PushService.js');

    const pushRepo = { findByUserIds: jest.fn(), delete: jest.fn(), save: jest.fn() };
    const service = new UnconfiguredPushService(pushRepo as any);

    expect(webpushModule.setVapidDetails).not.toHaveBeenCalled();

    await service.sendToUsers(['u1'], { title: 't', body: 'b', roomId: 'r1', roomName: 'General' });
    expect(pushRepo.findByUserIds).not.toHaveBeenCalled();
  });
});
