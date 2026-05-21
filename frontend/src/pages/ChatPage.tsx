import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useSocket } from '@/hooks/useSocket'
import { useRoomStore } from '@/store/useRoomStore'
import { listRooms } from '@/api/rooms'

export default function ChatPage() {
  useSocket()
  const setRooms = useRoomStore((s) => s.setRooms)

  useEffect(() => {
    listRooms().then(setRooms).catch(() => {/* silent — toast from axios interceptor */})
  }, [setRooms])

  return <AppShell />
}
