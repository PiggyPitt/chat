import { io, type Socket } from 'socket.io-client';
import { cliConfig } from './cli-config';

// ── Wire-format types ──────────────────────────────────────────────────────────

export interface NewMessagePayload {
  message: {
    type?: string;
    content: string;
    createdAt: string;
  };
  senderId: string;
  senderUsername: string;
}

type ServerToClientEvents = {
  'new-message': (payload: NewMessagePayload) => void;
  'user-joined': (payload: { userId: string; username: string; roomId: string }) => void;
  'user-left': (payload: { userId: string; username: string; roomId: string }) => void;
};

type ClientToServerEvents = {
  'join-room': (roomName: string, password: string | null, callback: (error: string | null, payload?: { roomId: string; messages: unknown[] }) => void) => void;
  'leave-room': (roomName: string, callback: (error: string | null) => void) => void;
  'send-message': (roomId: string, content: string, callback: (error: string | null) => void) => void;
  'send-image': (roomId: string, imageUrl: string, callback: (error: string | null) => void) => void;
  'list-users': (roomId: string, callback: (error: string | null, users?: string[]) => void) => void;
};

// ── Client ────────────────────────────────────────────────────────────────────

export class ChatSocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect(): void {
    this.socket = io(cliConfig.serverUrl, {
      path: cliConfig.socketPath,
      auth: { token: this.token },
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  onConnect(handler: () => void): void {
    this.socket?.on('connect', handler);
  }

  onDisconnect(handler: (reason: string) => void): void {
    this.socket?.on('disconnect', handler);
  }

  onNewMessage(handler: (payload: NewMessagePayload) => void): void {
    this.socket?.on('new-message', handler);
  }

  onUserJoined(handler: (payload: { userId: string; username: string; roomId: string }) => void): void {
    this.socket?.on('user-joined', handler);
  }

  onUserLeft(handler: (payload: { userId: string; username: string; roomId: string }) => void): void {
    this.socket?.on('user-left', handler);
  }

  async joinRoom(roomName: string, password?: string): Promise<{ roomId: string; messages: unknown[] }> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('join-room', roomName, password ?? null, (error, payload) => {
        if (error) { reject(new Error(error)); return; }
        resolve(payload as { roomId: string; messages: unknown[] });
      });
    });
  }

  async leaveRoom(roomName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('leave-room', roomName, (error) => {
        if (error) { reject(new Error(error)); return; }
        resolve();
      });
    });
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('send-message', roomId, content, (error) => {
        if (error) { reject(new Error(error)); return; }
        resolve();
      });
    });
  }

  async sendImage(roomId: string, imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('send-image', roomId, imageUrl, (error) => {
        if (error) { reject(new Error(error)); return; }
        resolve();
      });
    });
  }

  async listUsers(roomId: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('list-users', roomId, (error, users) => {
        if (error) { reject(new Error(error)); return; }
        resolve(users ?? []);
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }
}
