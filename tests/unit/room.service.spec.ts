import { RoomService } from '../../src/infrastructure/services/RoomService.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';

describe('RoomService', () => {
  const roomRepository = {
    findByName: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn()
  };
  const hashingService = {
    hash: jest.fn(),
    verify: jest.fn()
  };
  const roomService = new RoomService(roomRepository as any, hashingService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a room when no duplicate exists', async () => {
    roomRepository.findByName.mockResolvedValue(null);
    roomRepository.create.mockImplementation(async (room) => room);

    const room = await roomService.createRoom('General', 'u1');

    expect(room.name).toBe('General');
    expect(room.members).toEqual(['u1']);
  });

  it('rejects duplicate room names', async () => {
    roomRepository.findByName.mockResolvedValue({ name: 'General' });

    await expect(roomService.createRoom('General', 'u1')).rejects.toThrow(HttpError);
  });

  it('joins a room', async () => {
    roomRepository.findByName.mockResolvedValue({ id: 'r1', name: 'General', members: [] });
    roomRepository.addMember.mockResolvedValue({ id: 'r1', name: 'General', members: ['u1'] });

    const room = await roomService.joinRoom('General', 'u1');

    expect(room.members).toContain('u1');
  });

  it('leaves room when a member', async () => {
    roomRepository.findByName.mockResolvedValue({ id: 'r1', name: 'General', members: ['u1'] });
    roomRepository.removeMember.mockResolvedValue({ id: 'r1', name: 'General', members: [] });

    const room = await roomService.leaveRoom('General', 'u1');

    expect(room.members).not.toContain('u1');
  });

  it('throws when leaving a room without membership', async () => {
    roomRepository.findByName.mockResolvedValue({ id: 'r1', name: 'General', members: [] });

    await expect(roomService.leaveRoom('General', 'u1')).rejects.toThrow(HttpError);
  });
});
