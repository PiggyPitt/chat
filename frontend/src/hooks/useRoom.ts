import { joinRoom, leaveRoom, listUsers } from '@/socket/socketClient'
import { useRoomStore } from '@/store/useRoomStore'
import { useChatStore } from '@/store/useChatStore'
import { useUIStore } from '@/store/useUIStore'

export function useRoom() {
  const setActiveRoom = useRoomStore((s) => s.setActiveRoom)
  const clearActiveRoom = useRoomStore((s) => s.clearActiveRoom)
  const setMessages = useChatStore((s) => s.setMessages)
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers)
  const setHasMoreHistory = useChatStore((s) => s.setHasMoreHistory)
  const addToast = useUIStore((s) => s.addToast)

  async function join(roomName: string, password?: string) {
    try {
      const { roomId, messages } = await joinRoom(roomName, password)
      setMessages(roomId, messages)
      setHasMoreHistory(roomId, messages.length >= 50)
      setActiveRoom(roomId, roomName)
      const users = await listUsers(roomId)
      setOnlineUsers(roomId, users)
    } catch (err: unknown) {
      addToast((err as Error).message ?? 'Failed to join room', 'error')
      throw err
    }
  }

  async function leave(roomName: string) {
    try {
      await leaveRoom(roomName)
      clearActiveRoom()
    } catch (err: unknown) {
      addToast((err as Error).message ?? 'Failed to leave room', 'error')
    }
  }

  return { join, leave }
}
