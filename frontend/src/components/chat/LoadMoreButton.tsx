import { useState } from 'react'
import { fetchHistory } from '@/socket/socketClient'
import { useChatStore } from '@/store/useChatStore'
import { useRoomStore } from '@/store/useRoomStore'
import Spinner from '@/components/ui/Spinner'

export default function LoadMoreButton() {
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const messages = useChatStore((s) => (activeRoomId ? s.messages[activeRoomId] ?? [] : []))
  const hasMore = useChatStore((s) => (activeRoomId ? s.hasMoreHistory[activeRoomId] ?? false : false))
  const prependMessages = useChatStore((s) => s.prependMessages)
  const setHasMoreHistory = useChatStore((s) => s.setHasMoreHistory)
  const [loading, setLoading] = useState(false)

  if (!hasMore || !activeRoomId) return null

  async function handleLoadMore() {
    if (!activeRoomId || loading) return
    const oldest = messages[0]
    if (!oldest) return
    setLoading(true)
    try {
      const older = await fetchHistory(activeRoomId, oldest.createdAt)
      prependMessages(activeRoomId, older)
      setHasMoreHistory(activeRoomId, older.length >= 50)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-2">
      <button
        onClick={handleLoadMore}
        disabled={loading}
        className="flex items-center gap-2 text-xs text-dc-accent hover:text-indigo-400 transition-colors disabled:opacity-50"
      >
        {loading ? <Spinner size={14} /> : null}
        Load older messages
      </button>
    </div>
  )
}
