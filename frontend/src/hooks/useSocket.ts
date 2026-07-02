import { useEffect, useRef } from 'react'
import { connect, disconnect, getSocket, joinRoom, listUsers } from '@/socket/socketClient'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'
import { useRoomStore } from '@/store/useRoomStore'
import { useUIStore } from '@/store/useUIStore'
import type { Message } from '@/types'

export function useSocket() {
  const token = useAuthStore((s) => s.token)
  const appendMessage    = useChatStore((s) => s.appendMessage)
  const addOnlineUser    = useChatStore((s) => s.addOnlineUser)
  const removeOnlineUser = useChatStore((s) => s.removeOnlineUser)
  const setMessages      = useChatStore((s) => s.setMessages)
  const setOnlineUsers   = useChatStore((s) => s.setOnlineUsers)
  const setHasMoreHistory = useChatStore((s) => s.setHasMoreHistory)
  const activeRoomId     = useRoomStore((s) => s.activeRoomId)
  const activeRoomName   = useRoomStore((s) => s.activeRoomName)
  const setSocketConnected = useUIStore((s) => s.setSocketConnected)

  // Refs so the connect handler always sees the latest room without re-registering
  const hasConnectedRef = useRef(false)
  const activeRoomRef   = useRef<{ id: string; name: string } | null>(null)

  useEffect(() => {
    activeRoomRef.current =
      activeRoomId && activeRoomName ? { id: activeRoomId, name: activeRoomName } : null
  }, [activeRoomId, activeRoomName])

  useEffect(() => {
    if (!token) return
    connect(token)
    const socket = getSocket()
    if (!socket) return

    const onConnect = async () => {
      setSocketConnected(true)
      if (hasConnectedRef.current && activeRoomRef.current) {
        // Reconnected after mobile suspend / network drop — re-join to restore server membership
        // Server skips password re-check only if this socket session already verified it, so no
        // password needed here
        try {
          const { roomId, messages } = await joinRoom(activeRoomRef.current.name)
          setMessages(roomId, messages)
          setHasMoreHistory(roomId, messages.length >= 50)
          const users = await listUsers(roomId)
          setOnlineUsers(roomId, users)
        } catch {
          // room deleted or auth expired — leave as-is
        }
      }
      hasConnectedRef.current = true
    }

    const onDisconnect = () => {
      setSocketConnected(false)
    }

    const onNewMessage = (payload: { message: Message; senderId: string; senderUsername: string }) => {
      appendMessage(payload.message.roomId, payload.message)
    }

    const onUserJoined = (payload: { userId: string; username: string; roomId: string }) => {
      addOnlineUser(payload.roomId, payload.username)
    }

    const onUserLeft = (payload: { userId: string; username: string; roomId: string }) => {
      removeOnlineUser(payload.roomId, payload.username)
    }

    socket.on('connect',     onConnect)
    socket.on('disconnect',  onDisconnect)
    socket.on('new-message', onNewMessage)
    socket.on('user-joined', onUserJoined)
    socket.on('user-left',   onUserLeft)

    // Page Visibility API — mobile browsers suspend JS when backgrounded, breaking socket.io
    // auto-reconnect. Force reconnect when user returns to the tab.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const sock = getSocket()
        if (sock && !sock.connected) {
          sock.connect()
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      socket.off('connect',     onConnect)
      socket.off('disconnect',  onDisconnect)
      socket.off('new-message', onNewMessage)
      socket.off('user-joined', onUserJoined)
      socket.off('user-left',   onUserLeft)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      disconnect()
    }
  }, [token, appendMessage, addOnlineUser, removeOnlineUser, setMessages, setOnlineUsers, setHasMoreHistory, setSocketConnected])
}
