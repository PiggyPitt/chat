export type UserRole = 'user' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'banned'
export type MessageType = 'text' | 'image'

export interface User {
  id: string
  username: string
  status: UserStatus
  role: UserRole
  createdAt: string
}

export interface Room {
  id: string
  name: string
  hasPassword: boolean
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderUsername: string
  type: MessageType
  content: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  userId: string
  username: string
  role: UserRole
}

export interface PendingUser {
  id: string
  username: string
  createdAt: string
}

export interface GifResult {
  id: string
  url: string
  previewUrl: string
  width: number
  height: number
}
