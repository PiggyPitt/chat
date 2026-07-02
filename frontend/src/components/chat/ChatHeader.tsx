import { useRoomStore } from '@/store/useRoomStore'
import { useUIStore } from '@/store/useUIStore'
import { useRoom } from '@/hooks/useRoom'
import { toggleMuteRoom } from '@/api/push'

export default function ChatHeader() {
  const activeRoomName = useRoomStore((s) => s.activeRoomName)
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const isMuted = useRoomStore((s) => s.isMuted)
  const setMuted = useRoomStore((s) => s.setMuted)
  const muted = activeRoomId ? isMuted(activeRoomId) : false
  const { leave } = useRoom()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar)
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen)
  const socketConnected = useUIStore((s) => s.socketConnected)
  const addToast = useUIStore((s) => s.addToast)

  async function handleToggleMute() {
    if (!activeRoomId) return
    try {
      const { muted: next } = await toggleMuteRoom(activeRoomId)
      setMuted(activeRoomId, next)
      addToast(`Notifications ${next ? 'muted' : 'unmuted'}`, 'success')
    } catch {
      addToast('Failed to toggle mute', 'error')
    }
  }

  return (
    <div className="border-b border-dc-border shrink-0">
      {!socketConnected && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 text-yellow-300 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Reconnecting...
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 gap-2">

      {/* left: hamburger + room name */}
      <div className="flex items-center gap-2 min-w-0">
        {/* hamburger — always visible */}
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide channels' : 'Show channels'}
          className="text-dc-muted hover:text-dc-text transition-colors p-1.5 rounded hover:bg-dc-hover shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {activeRoomName ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-dc-muted text-base shrink-0">#</span>
            <span className="font-semibold text-dc-text truncate">{activeRoomName}</span>
          </div>
        ) : (
          <span className="text-dc-muted text-sm">Select a channel</span>
        )}
      </div>

      {/* right: mute + members toggle + leave */}
      <div className="flex items-center gap-1 shrink-0">
        {activeRoomId && (
          <button
            onClick={handleToggleMute}
            title={muted ? 'Unmute notifications' : 'Mute notifications'}
            className={`p-1.5 rounded transition-colors ${
              muted
                ? 'text-dc-muted hover:text-dc-text hover:bg-dc-hover'
                : 'text-dc-text hover:bg-dc-hover'
            }`}
          >
            {muted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M17.73 17.73A10.16 10.16 0 0 1 12 20c-1 0-2-.1-3-.3"/>
                <path d="M6.27 6.27A10 10 0 0 0 2 12c0 5.52 4.48 10 10 10"/>
                <path d="M12 2a10 10 0 0 1 9.9 11"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            )}
          </button>
        )}
        {/* members / online toggle */}
        <button
          onClick={toggleRightSidebar}
          title={rightSidebarOpen ? 'Hide members' : 'Show members'}
          className={`p-1.5 rounded transition-colors ${
            rightSidebarOpen
              ? 'text-dc-text bg-dc-active'
              : 'text-dc-muted hover:text-dc-text hover:bg-dc-hover'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </button>

        {activeRoomName && (
          <button
            onClick={() => leave(activeRoomName)}
            title="Leave channel"
            className="p-1.5 rounded text-dc-muted hover:text-dc-red hover:bg-dc-hover transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="text-xs hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
