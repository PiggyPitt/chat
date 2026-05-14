import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { IAuthService } from '../../application/interfaces/services/IAuthService';
import { IMessageService } from '../../application/interfaces/services/IMessageService';
import { IRoomService } from '../../application/interfaces/services/IRoomService';
import { Logger } from '../../shared/logger/logger.js';
import { config } from '../../shared/config/index.js';

interface ClientPayload {
  token: string;
}

export class SocketServer {
  private io: Server | null = null;

  constructor(
    private readonly httpServer: HttpServer,
    private readonly authService: IAuthService,
    private readonly roomService: IRoomService,
    private readonly messageService: IMessageService
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
          const history = await this.messageService.getHistory(room.id);
          callback(null, { roomId: room.id, messages: history });
          socket.to(room.id).emit('user-joined', { userId, username, roomId: room.id });
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('leave-room', async (roomName: string, callback: (error: string | null) => void) => {
        try {
          const room = await this.roomService.leaveRoom(roomName, userId);
          socket.leave(room.id);
          socket.to(room.id).emit('user-left', { userId, username, roomId: room.id });
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
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('list-users', async (roomId: string, callback: (error: string | null, users?: string[]) => void) => {
        try {
          const sockets = await this.io?.in(roomId).fetchSockets();
          const users = sockets?.map((client) => client.data.userId as string).filter(Boolean) ?? [];
          callback(null, Array.from(new Set(users)));
        } catch (error) {
          callback((error as Error).message);
        }
      });

      socket.on('disconnect', () => {
        Logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }
}
