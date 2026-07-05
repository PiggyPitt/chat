import { RoomController } from '../../src/presentation/server/controllers/RoomController.js';

// authMiddleware.authenticate always sets req.userId before these run in production, so this
// guard can't be hit over real HTTP — exercise it directly to cover the defensive branch.
describe('RoomController — missing user context guard', () => {
  const controller = new RoomController({} as any, {} as any, {} as any, {} as any);

  function makeReq(body: object) {
    return { body, userId: undefined } as any;
  }

  it('create() rejects when req.userId is missing', async () => {
    const next = jest.fn();
    await controller.create(makeReq({ name: 'General' }), {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing user context' }));
  });

  it('join() rejects when req.userId is missing', async () => {
    const next = jest.fn();
    await controller.join(makeReq({ name: 'General' }), {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing user context' }));
  });

  it('leave() rejects when req.userId is missing', async () => {
    const next = jest.fn();
    await controller.leave(makeReq({ name: 'General' }), {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing user context' }));
  });
});
