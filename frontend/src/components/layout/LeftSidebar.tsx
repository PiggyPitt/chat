import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { disconnect } from '@/socket/socketClient'
import { useNavigate } from 'react-router-dom'
import RoomList from '@/components/rooms/RoomList'

export default function LeftSidebar() {
  const username = useAuthStore((s) => s.username)
  const role = useAuthStore((s) => s.role)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setShowCreateRoom = useUIStore((s) => s.setShowCreateRoom)
  const setShowAdminPanel = useUIStore((s) => s.setShowAdminPanel)
  const navigate = useNavigate()

  function handleLogout() {
    disconnect()
    clearAuth()
    navigate('/login')
  }

  const initial = username?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col h-full bg-dc-sidebar">
      {/* Header */}
      <div className="px-3 py-3 border-b border-dc-border">
        <h2 className="text-sm font-semibold text-dc-text">Channels</h2>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="text-dc-muted text-xs font-semibold uppercase tracking-wide px-2 mb-1">Text Channels</p>
        <RoomList />
        <button
          onClick={() => setShowCreateRoom(true)}
          className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-dc-muted hover:text-dc-text hover:bg-dc-hover transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>Create Channel</span>
        </button>
      </div>

      {/* User panel footer */}
      <div className="px-3 py-2 border-t border-dc-border bg-dc-border/50 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-dc-accent flex items-center justify-center text-white text-sm font-semibold shrink-0">
          {initial}
        </div>
        <span className="flex-1 text-sm text-dc-text truncate">{username}</span>
        {role === 'admin' && (
          <button
            onClick={() => setShowAdminPanel(true)}
            title="Admin Panel"
            className="text-dc-muted hover:text-dc-text transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        )}
        <button
          onClick={handleLogout}
          title="Log out"
          className="text-dc-muted hover:text-dc-red transition-colors p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
