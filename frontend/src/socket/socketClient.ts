import { io, Socket } from 'socket.io-client'
import type { Message } from '@/types'

interface ServerToClientEvents {
  'new-message': (payload: { message: Message; senderId: string; senderUsername: string }) => void
  'user-joined': (payload: { userId: string; username: string; roomId: string }) => void
  'user-left': (payload: { userId: string; username: string; roomId: string }) => void
}

interface ClientToServerEvents {
  'join-room': (roomName: string, password: string | null, cb: (err: string | null, payload?: { roomId: string; messages: Message[] }) => void) => void
  'leave-room': (roomName: string, cb: (err: string | null) => void) => void
  'send-message': (roomId: string, content: string, cb: (err: string | null) => void) => void
  'send-image': (roomId: string, imageUrl: string, cb: (err: string | null) => void) => void
  'get-history': (roomId: string, before: string, cb: (err: string | null, messages?: Message[]) => void) => void
  'list-users': (roomId: string, cb: (err: string | null, users?: string[]) => void) => void
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: TypedSocket | null = null

export function connect(token: string): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  socket = io('/', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  }) as TypedSocket
}

export function disconnect(): void {
  socket?.disconnect()
  socket = null
}

export function getSocket(): TypedSocket | null {
  return socket
}

export function joinRoom(roomName: string, password?: string): Promise<{ roomId: string; messages: Message[] }> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'))
    socket.emit('join-room', roomName, password ?? null, (err, payload) => {
      if (err) reject(new Error(err))
      else resolve(payload!)
    })
  })
}

export function leaveRoom(roomName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'))
    socket.emit('leave-room', roomName, (err) => {
      if (err) reject(new Error(err))
      else resolve()
    })
  })
}

export function sendMessage(roomId: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'))
    socket.emit('send-message', roomId, content, (err) => {
      if (err) reject(new Error(err))
      else resolve()
    })
  })
}

export function sendImage(roomId: string, imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'))
    socket.emit('send-image', roomId, imageUrl, (err) => {
      if (err) reject(new Error(err))
      else resolve()
    })
  })
}

export function fetchHistory(roomId: string, before: string): Promise<Message[]> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'))
    socket.emit('get-history', roomId, before, (err, messages) => {
      if (err) reject(new Error(err))
      else resolve(messages ?? [])
    })
  })
}

export function listUsers(roomId: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Not connected'))
    socket.emit('list-users', roomId, (err, users) => {
      if (err) reject(new Error(err))
      else resolve(users ?? [])
    })
  })
}
