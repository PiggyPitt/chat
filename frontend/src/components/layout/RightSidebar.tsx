import { useRoomStore } from '@/store/useRoomStore'
import { useChatStore } from '@/store/useChatStore'

export default function RightSidebar() {
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const onlineUsers = useChatStore((s) => (activeRoomId ? s.onlineUsers[activeRoomId] ?? [] : []))

  return (
    <div className="flex flex-col h-full bg-dc-sidebar border-l border-dc-border">
      <div className="px-3 py-3 border-b border-dc-border">
        <h2 className="text-xs font-semibold text-dc-muted uppercase tracking-wide">
          Online — {onlineUsers.length}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
        {onlineUsers.map((user) => (
          <div key={user} className="flex items-center gap-2 px-2 py-1">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-dc-input flex items-center justify-center text-dc-muted text-sm font-medium">
                {user[0]?.toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-dc-green rounded-full border-2 border-dc-sidebar" />
            </div>
            <span className="text-sm text-dc-text truncate">{user}</span>
          </div>
        ))}
        {activeRoomId && onlineUsers.length === 0 && (
          <p className="text-dc-muted text-xs px-2 py-2">No users online</p>
        )}
        {!activeRoomId && (
          <p className="text-dc-muted text-xs px-2 py-2">Join a channel to see members</p>
        )}
      </div>
    </div>
  )
}
