import { create } from 'zustand'
import type { Message } from '@/types'

interface ChatState {
  messages: Record<string, Message[]>
  onlineUsers: Record<string, string[]>
  hasMoreHistory: Record<string, boolean>
  setMessages: (roomId: string, messages: Message[]) => void
  prependMessages: (roomId: string, messages: Message[]) => void
  appendMessage: (roomId: string, message: Message) => void
  setOnlineUsers: (roomId: string, users: string[]) => void
  addOnlineUser: (roomId: string, username: string) => void
  removeOnlineUser: (roomId: string, username: string) => void
  setHasMoreHistory: (roomId: string, has: boolean) => void
  clearRoom: (roomId: string) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: {},
  onlineUsers: {},
  hasMoreHistory: {},

  setMessages: (roomId, messages) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: messages } })),

  prependMessages: (roomId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...messages, ...(s.messages[roomId] ?? [])],
      },
    })),

  appendMessage: (roomId, message) =>
    set((s) => {
      const existing = s.messages[roomId] ?? []
      if (existing.some((m) => m.id === message.id)) return s
      return { messages: { ...s.messages, [roomId]: [...existing, message] } }
    }),

  setOnlineUsers: (roomId, users) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [roomId]: users } })),

  addOnlineUser: (roomId, username) =>
    set((s) => {
      const existing = s.onlineUsers[roomId] ?? []
      if (existing.includes(username)) return s
      return { onlineUsers: { ...s.onlineUsers, [roomId]: [...existing, username] } }
    }),

  removeOnlineUser: (roomId, username) =>
    set((s) => ({
      onlineUsers: {
        ...s.onlineUsers,
        [roomId]: (s.onlineUsers[roomId] ?? []).filter((u) => u !== username),
      },
    })),

  setHasMoreHistory: (roomId, has) =>
    set((s) => ({ hasMoreHistory: { ...s.hasMoreHistory, [roomId]: has } })),

  clearRoom: (roomId) =>
    set((s) => {
      const { [roomId]: _m, ...messages } = s.messages
      const { [roomId]: _u, ...onlineUsers } = s.onlineUsers
      const { [roomId]: _h, ...hasMoreHistory } = s.hasMoreHistory
      return { messages, onlineUsers, hasMoreHistory }
    }),
}))
