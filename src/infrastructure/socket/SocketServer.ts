import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { IAuthService } from '../../application/interfaces/services/IAuthService';
import { IMessageService } from '../../application/interfaces/services/IMessageService';
import { IRoomService } from '../../application/interfaces/services/IRoomService';
import { IUserRepository } from '../../application/interfaces/repositories/IUserRepository';
import { PushService } from '../services/PushService.js';
import { Logger } from '../../shared/logger/logger.js';
import { config } from '../../shared/config/index.js';

interface ClientPayload {
  token: string;
}

export class SocketServer {
  private io: Server | null = null;
  // roomUsers tracks which users have joined a room this server session (survives socket disconnect)
  private readonly roomUsers = new Map<string, Set<string>>();

  constructor(
    private readonly httpServer: HttpServer,
    private readonly authService: IAuthService,
    private readonly roomService: IRoomService,
    private readonly messageService: IMessageService,
    private readonly userRepository: IUserRepository,
    private readonly pushService: PushService
  ) {}

  start(): Server {
    this.io = new Server(this.httpServer, {
      path: config.socketPath,
      cors: {
        origin: true,
        methods: ['GET', 'POST']
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const { token } = socket.handshake.auth as ClientPayload;
        if (!token) {
          throw new Error('Authentication token is required');
        }
        const { userId, username } = await this.authService.verifyToken(token);
        (socket.data as { userId: string; username: string }).userId = userId;
        (socket.data as { userId: string; username: string }).username = username;
        next();
      } catch (err) {
        next(err as Error);
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId as string;
      const username = socket.data.username as string;
      Logger.info(`Socket connected: ${socket.id} user=${username}`);

      socket.on('join-room', async (roomName: string, password: string | null, callback: (error: string | null, payload?: { roomId: string; messages: unknown[] }) => void) => {
        try {
          const room = await this.roomService.joinRoom(roomName, userId, password ?? undefined);
          socket.join(room.id);

          if (!this.roomUsers.has(room.id)) this.roomUsers.set(room.id, new Set());
          this.roomUsers.get(room.id)!.add(userId);

          const history = await this.messageService.getHistory(room.id);
          callback(null, { roomId: room.id, messages: history });
          socket.to(room.id).emit('user-joined', { userId, username, roomId: room.id });
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('get-history', async (roomId: string, before: string, callback: (error: string | null, messages?: unknown[]) => void) => {
        try {
          const history = await this.messageService.getHistory(roomId, 50, new Date(before));
          callback(null, history);
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('leave-room', async (roomName: string, callback: (error: string | null) => void) => {
        try {
          const room = await this.roomService.leaveRoom(roomName, userId);
          // emit BEFORE leave — socket.to() targets only remaining room members
          socket.to(room.id).emit('user-left', { userId, username, roomId: room.id });
          socket.leave(room.id);
          // explicit leave — remove from push tracking so they stop receiving push for this room
          this.roomUsers.get(room.id)?.delete(userId);
          callback(null);
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('send-message', async (roomId: string, content: string, callback: (error: string | null) => void) => {
        try {
          const message = await this.messageService.sendMessage(roomId, userId, username, content);
          this.io?.to(roomId).emit('new-message', { message, senderId: userId, senderUsername: username });
          callback(null);
          this.notifyOfflineUsers(roomId, userId, username, content).catch(() => {});
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('send-image', async (roomId: string, imageUrl: string, callback: (error: string | null) => void) => {
        try {
          const message = await this.messageService.sendMessage(roomId, userId, username, imageUrl, 'image');
          this.io?.to(roomId).emit('new-message', { message, senderId: userId, senderUsername: username });
          callback(null);
          this.notifyOfflineUsers(roomId, userId, username, '📷 Image').catch(() => {});
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('list-users', async (roomId: string, callback: (error: string | null, users?: string[]) => void) => {
        try {
          const sockets = await this.io?.in(roomId).fetchSockets();
          const users = sockets?.map((client) => client.data.username as string).filter(Boolean) ?? [];
          callback(null, Array.from(new Set(users)));
        } catch (error) {
          callback((error as Error).message);
        }
      });

      // disconnecting fires before Socket.IO removes the socket from rooms
      socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
          if (roomId === socket.id) continue;
          socket.to(roomId).emit('user-left', { userId, username, roomId });
          // intentionally keep roomUsers entry — user backgrounded the app, still wants push
        }
      });

      socket.on('disconnect', () => {
        Logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  private async notifyOfflineUsers(roomId: string, senderId: string, senderUsername: string, preview: string): Promise<void> {
    if (!this.io) return;

    const connectedSockets = await this.io.in(roomId).fetchSockets();
    const onlineUserIds = new Set(connectedSockets.map((s) => s.data.userId as string));

    const candidates = this.roomUsers.get(roomId);
    if (!candidates) return;

    const offlineUserIds = [...candidates].filter((uid) => uid !== senderId && !onlineUserIds.has(uid));
    if (offlineUserIds.length === 0) return;

    const mutedChecks = await Promise.all(
      offlineUserIds.map(async (uid) => {
        const mutedRooms = await this.userRepository.getMutedRooms(uid);
        return mutedRooms.includes(roomId) ? null : uid;
      })
    );
    const targetUserIds = mutedChecks.filter((uid): uid is string => uid !== null);
    if (targetUserIds.length === 0) return;

    const rooms = await this.roomService.listRooms();
    const roomName = rooms.find((r) => r.id === roomId)?.name ?? roomId;

    const body = `${senderUsername}: ${preview.length > 80 ? preview.slice(0, 80) + '…' : preview}`;
    await this.pushService.sendToUsers(targetUserIds, { title: `#${roomName}`, body, roomId, roomName });
  }
}
