import { useRoomStore } from '@/store/useRoomStore'
import { useUIStore } from '@/store/useUIStore'
import { useRoom } from '@/hooks/useRoom'

export default function ChatHeader() {
  const activeRoomName = useRoomStore((s) => s.activeRoomName)
  const { leave } = useRoom()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar)
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen)

  return (
    <div className="h-12 border-b border-dc-border flex items-center justify-between px-3 shrink-0 gap-2">

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

      {/* right: members toggle + leave */}
      <div className="flex items-center gap-1 shrink-0">
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
  )
}
