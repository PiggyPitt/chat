import { RoomService } from '../../src/infrastructure/services/RoomService.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';
import { Room } from '../../src/domain/entities/Room.js';

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

  it('throws when leaving a room that does not exist', async () => {
    roomRepository.findByName.mockResolvedValue(null);

    await expect(roomService.leaveRoom('Ghost', 'u1')).rejects.toThrow(HttpError);
  });

  it('lists all rooms via the repository', async () => {
    roomRepository.list.mockResolvedValue([{ id: 'r1' }]);

    const rooms = await roomService.listRooms();

    expect(roomRepository.list).toHaveBeenCalled();
    expect(rooms).toEqual([{ id: 'r1' }]);
  });

  it('hashes the password when creating a protected room', async () => {
    roomRepository.findByName.mockResolvedValue(null);
    hashingService.hash.mockResolvedValue('hashed-pw');
    roomRepository.create.mockImplementation(async (room) => room);

    const room = await roomService.createRoom('Secret', 'u1', 'pw');

    expect(hashingService.hash).toHaveBeenCalledWith('pw');
    expect(room.passwordHash).toBe('hashed-pw');
  });

  it('throws when joining a room that does not exist', async () => {
    roomRepository.findByName.mockResolvedValue(null);

    await expect(roomService.joinRoom('Ghost', 'u1')).rejects.toThrow(HttpError);
  });

  it('requires the password again even for an existing member', async () => {
    const room = new Room({ id: 'r1', name: 'General', createdBy: 'owner', members: ['u1'], passwordHash: 'hash' });
    roomRepository.findByName.mockResolvedValue(room);
    hashingService.verify.mockResolvedValue(false);

    await expect(roomService.joinRoom('General', 'u1', 'wrong')).rejects.toThrow(HttpError);
    expect(roomRepository.addMember).not.toHaveBeenCalled();
  });

  it('requires a password for a protected room', async () => {
    const room = new Room({ id: 'r1', name: 'General', createdBy: 'owner', passwordHash: 'hash' });
    roomRepository.findByName.mockResolvedValue(room);

    await expect(roomService.joinRoom('General', 'u1')).rejects.toThrow(HttpError);
  });

  it('rejects an incorrect room password', async () => {
    const room = new Room({ id: 'r1', name: 'General', createdBy: 'owner', passwordHash: 'hash' });
    roomRepository.findByName.mockResolvedValue(room);
    hashingService.verify.mockResolvedValue(false);

    await expect(roomService.joinRoom('General', 'u1', 'wrong')).rejects.toThrow(HttpError);
  });

  it('joins a password-protected room with the correct password', async () => {
    const room = new Room({ id: 'r1', name: 'General', createdBy: 'owner', passwordHash: 'hash' });
    roomRepository.findByName.mockResolvedValue(room);
    hashingService.verify.mockResolvedValue(true);
    roomRepository.addMember.mockResolvedValue({ id: 'r1', name: 'General', members: ['u1'] });

    const result = await roomService.joinRoom('General', 'u1', 'correct');

    expect(hashingService.verify).toHaveBeenCalledWith('correct', 'hash');
    expect(result.members).toContain('u1');
  });
});
