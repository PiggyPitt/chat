import { MessageService } from '../../src/infrastructure/services/MessageService.js';

describe('MessageService', () => {
  function makeRepo() {
    return {
      create: jest.fn(),
      listByRoom: jest.fn(),
      deleteByRoom: jest.fn()
    };
  }

  it('defaults new messages to type "text"', async () => {
    const repository = makeRepo();
    repository.create.mockImplementation(async (m) => m);
    const service = new MessageService(repository as any);

    const message = await service.sendMessage('r1', 'u1', 'mike', 'hello');

    expect(message.type).toBe('text');
    expect(repository.create).toHaveBeenCalled();
  });

  it('sends an image message when a type is given', async () => {
    const repository = makeRepo();
    repository.create.mockImplementation(async (m) => m);
    const service = new MessageService(repository as any);

    const message = await service.sendMessage('r1', 'u1', 'mike', '/uploads/pic.png', 'image');

    expect(message.type).toBe('image');
  });

  it('delegates history lookups to the repository', async () => {
    const repository = makeRepo();
    repository.listByRoom.mockResolvedValue([]);
    const service = new MessageService(repository as any);

    await service.getHistory('r1', 10, undefined);

    expect(repository.listByRoom).toHaveBeenCalledWith('r1', 10, undefined);
  });

  it('delegates room history clearing to the repository', async () => {
    const repository = makeRepo();
    repository.deleteByRoom.mockResolvedValue(4);
    const service = new MessageService(repository as any);

    const deleted = await service.clearHistory('r1');

    expect(repository.deleteByRoom).toHaveBeenCalledWith('r1');
    expect(deleted).toBe(4);
  });
});
