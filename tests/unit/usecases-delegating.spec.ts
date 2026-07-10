import { CreateRoomUseCase } from '../../src/application/usecases/room/CreateRoomUseCase.js';
import { ListRoomsUseCase } from '../../src/application/usecases/room/ListRoomsUseCase.js';
import { LeaveRoomUseCase } from '../../src/application/usecases/room/LeaveRoomUseCase.js';
import { JoinRoomUseCase } from '../../src/application/usecases/room/JoinRoomUseCase.js';
import { UnsubscribePushUseCase } from '../../src/application/usecases/push/UnsubscribePushUseCase.js';
import { SubscribePushUseCase } from '../../src/application/usecases/push/SubscribePushUseCase.js';
import { ToggleMuteRoomUseCase } from '../../src/application/usecases/push/ToggleMuteRoomUseCase.js';
import { SendMessageUseCase } from '../../src/application/usecases/message/SendMessageUseCase.js';
import { GetRoomHistoryUseCase } from '../../src/application/usecases/message/GetRoomHistoryUseCase.js';
import { ListPendingUsersUseCase } from '../../src/application/usecases/admin/ListPendingUsersUseCase.js';
import { ApproveUserUseCase } from '../../src/application/usecases/admin/ApproveUserUseCase.js';
import { RejectUserUseCase } from '../../src/application/usecases/admin/RejectUserUseCase.js';
import { ClearRoomMessagesUseCase } from '../../src/application/usecases/admin/ClearRoomMessagesUseCase.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';
import { AppError } from '../../src/shared/errors/AppError.js';

describe('CreateRoomUseCase', () => {
  it('delegates to roomService.createRoom with an optional password', async () => {
    const roomService = { createRoom: jest.fn().mockResolvedValue({ id: 'r1' }) };
    const result = await new CreateRoomUseCase(roomService as any).execute('General', 'u1', 'pw');
    expect(roomService.createRoom).toHaveBeenCalledWith('General', 'u1', 'pw');
    expect(result).toEqual({ id: 'r1' });
  });
});

describe('ListRoomsUseCase', () => {
  it('delegates to roomService.listRooms', async () => {
    const roomService = { listRooms: jest.fn().mockResolvedValue([{ id: 'r1' }]) };
    const result = await new ListRoomsUseCase(roomService as any).execute();
    expect(roomService.listRooms).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'r1' }]);
  });
});

describe('LeaveRoomUseCase', () => {
  it('delegates to roomService.leaveRoom', async () => {
    const roomService = { leaveRoom: jest.fn().mockResolvedValue({ id: 'r1' }) };
    const result = await new LeaveRoomUseCase(roomService as any).execute('General', 'u1');
    expect(roomService.leaveRoom).toHaveBeenCalledWith('General', 'u1');
    expect(result).toEqual({ id: 'r1' });
  });
});

describe('JoinRoomUseCase', () => {
  it('delegates to roomService.joinRoom with password', async () => {
    const roomService = { joinRoom: jest.fn().mockResolvedValue({ id: 'r1' }) };
    const result = await new JoinRoomUseCase(roomService as any).execute('General', 'u1', 'pw');
    expect(roomService.joinRoom).toHaveBeenCalledWith('General', 'u1', 'pw');
    expect(result).toEqual({ id: 'r1' });
  });
});

describe('SubscribePushUseCase / UnsubscribePushUseCase', () => {
  it('saves a push subscription', async () => {
    const pushRepo = { save: jest.fn().mockResolvedValue(undefined), delete: jest.fn() };
    const sub = { endpoint: 'https://push.example', keys: { p256dh: 'a', auth: 'b' } };
    await new SubscribePushUseCase(pushRepo as any).execute('u1', sub);
    expect(pushRepo.save).toHaveBeenCalledWith('u1', sub);
  });

  it('deletes a push subscription', async () => {
    const pushRepo = { save: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    await new UnsubscribePushUseCase(pushRepo as any).execute('u1', 'https://push.example');
    expect(pushRepo.delete).toHaveBeenCalledWith('u1', 'https://push.example');
  });
});

describe('ToggleMuteRoomUseCase', () => {
  it('returns the muted flag from the repository', async () => {
    const userRepo = { toggleMuteRoom: jest.fn().mockResolvedValue({ mutedRooms: ['r1'], muted: true }) };
    const result = await new ToggleMuteRoomUseCase(userRepo as any).execute('u1', 'r1');
    expect(userRepo.toggleMuteRoom).toHaveBeenCalledWith('u1', 'r1');
    expect(result).toEqual({ muted: true });
  });
});

describe('SendMessageUseCase / GetRoomHistoryUseCase', () => {
  it('delegates message sending', async () => {
    const messageService = { sendMessage: jest.fn().mockResolvedValue({ id: 'm1' }), getHistory: jest.fn() };
    const result = await new SendMessageUseCase(messageService as any).execute('r1', 'u1', 'mike', 'hi');
    expect(messageService.sendMessage).toHaveBeenCalledWith('r1', 'u1', 'mike', 'hi');
    expect(result).toEqual({ id: 'm1' });
  });

  it('delegates room history with the default limit', async () => {
    const messageService = { sendMessage: jest.fn(), getHistory: jest.fn().mockResolvedValue([]) };
    await new GetRoomHistoryUseCase(messageService as any).execute('r1');
    expect(messageService.getHistory).toHaveBeenCalledWith('r1', 50);
  });
});

describe('ListPendingUsersUseCase', () => {
  it('lists users with pending status', async () => {
    const userRepository = { findByStatus: jest.fn().mockResolvedValue([{ id: 'u1' }]) };
    const result = await new ListPendingUsersUseCase(userRepository as any).execute();
    expect(userRepository.findByStatus).toHaveBeenCalledWith('pending');
    expect(result).toEqual([{ id: 'u1' }]);
  });
});

function makeUserRepo() {
  return {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn()
  };
}

describe('ApproveUserUseCase', () => {
  it('approves a user found by username', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue({ id: 'u1' });
    userRepository.updateStatus.mockResolvedValue({ id: 'u1', status: 'approved' });

    const result = await new ApproveUserUseCase(userRepository as any).execute('mike');

    expect(userRepository.updateStatus).toHaveBeenCalledWith('u1', 'approved');
    expect(result).toEqual({ id: 'u1', status: 'approved' });
  });

  it('falls back to resolving by id when username lookup misses', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue({ id: 'u1' });
    userRepository.updateStatus.mockResolvedValue({ id: 'u1', status: 'approved' });

    await new ApproveUserUseCase(userRepository as any).execute('u1');

    expect(userRepository.findById).toHaveBeenCalledWith('u1');
  });

  it('throws when the target cannot be resolved', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(null);

    await expect(new ApproveUserUseCase(userRepository as any).execute('ghost')).rejects.toThrow(HttpError);
  });

  it('throws when updateStatus reports no matching user', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue({ id: 'u1' });
    userRepository.updateStatus.mockResolvedValue(null);

    await expect(new ApproveUserUseCase(userRepository as any).execute('mike')).rejects.toThrow(HttpError);
  });
});

describe('RejectUserUseCase', () => {
  it('rejects a user found by username', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue({ id: 'u1' });
    userRepository.updateStatus.mockResolvedValue({ id: 'u1', status: 'rejected' });

    const result = await new RejectUserUseCase(userRepository as any).execute('mike');

    expect(userRepository.updateStatus).toHaveBeenCalledWith('u1', 'rejected');
    expect(result).toEqual({ id: 'u1', status: 'rejected' });
  });

  it('falls back to resolving by id when username lookup misses', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue({ id: 'u1' });
    userRepository.updateStatus.mockResolvedValue({ id: 'u1', status: 'rejected' });

    await new RejectUserUseCase(userRepository as any).execute('u1');

    expect(userRepository.findById).toHaveBeenCalledWith('u1');
  });

  it('throws when the target cannot be resolved', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(null);

    await expect(new RejectUserUseCase(userRepository as any).execute('ghost')).rejects.toThrow(HttpError);
  });

  it('throws when updateStatus reports no matching user', async () => {
    const userRepository = makeUserRepo();
    userRepository.findByUsername.mockResolvedValue({ id: 'u1' });
    userRepository.updateStatus.mockResolvedValue(null);

    await expect(new RejectUserUseCase(userRepository as any).execute('mike')).rejects.toThrow(HttpError);
  });
});

describe('ClearRoomMessagesUseCase', () => {
  it('clears history for an existing room', async () => {
    const roomRepository = { findByName: jest.fn().mockResolvedValue({ id: 'r1', name: 'General' }) };
    const messageService = { clearHistory: jest.fn().mockResolvedValue(3) };

    const result = await new ClearRoomMessagesUseCase(roomRepository as any, messageService as any).execute('General');

    expect(messageService.clearHistory).toHaveBeenCalledWith('r1');
    expect(result).toEqual({ roomId: 'r1', roomName: 'General', deletedCount: 3 });
  });

  it('throws when the room does not exist', async () => {
    const roomRepository = { findByName: jest.fn().mockResolvedValue(null) };
    const messageService = { clearHistory: jest.fn() };

    await expect(
      new ClearRoomMessagesUseCase(roomRepository as any, messageService as any).execute('Ghost')
    ).rejects.toThrow(AppError);
    expect(messageService.clearHistory).not.toHaveBeenCalled();
  });
});
