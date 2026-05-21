import type { Room } from '@/types'
import { useRoomStore } from '@/store/useRoomStore'
import { useUIStore } from '@/store/useUIStore'
import { useRoom } from '@/hooks/useRoom'

interface Props {
  room: Room
}

export default function RoomItem({ room }: Props) {
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const openPasswordModal = useUIStore((s) => s.openPasswordModal)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const { join } = useRoom()
  const isActive = activeRoomId === room.id

  function handleClick() {
    if (isActive) return
    // auto-close sidebar on mobile after selecting a room
    if (window.innerWidth < 1024) setSidebarOpen(false)
    if (room.hasPassword) {
      openPasswordModal(room.name)
    } else {
      join(room.name)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors
        ${isActive ? 'bg-dc-active text-dc-text' : 'text-dc-muted hover:bg-dc-hover hover:text-dc-text'}`}
    >
      <span className="text-dc-muted text-base">#</span>
      <span className="flex-1 truncate">{room.name}</span>
      {room.hasPassword && (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )}
    </button>
  )
}
