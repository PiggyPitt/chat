import { FormEvent, useState } from 'react'
import { clearRoomMessages } from '@/api/admin'
import { useUIStore } from '@/store/useUIStore'
import { useRoomStore } from '@/store/useRoomStore'
import { useChatStore } from '@/store/useChatStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ClearRoomMessages() {
  const rooms = useRoomStore((s) => s.rooms)
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const setMessages = useChatStore((s) => s.setMessages)
  const addToast = useUIStore((s) => s.addToast)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected || confirm !== 'DELETE') return
    setLoading(true)
    try {
      const result = await clearRoomMessages(selected)
      addToast(`Deleted ${result.deletedCount} messages from #${selected}`, 'success')
      const room = rooms.find((r) => r.name === selected)
      if (room && room.id === activeRoomId) {
        setMessages(room.id, [])
      }
      setSelected('')
      setConfirm('')
    } catch {
      addToast('Failed to clear messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-dc-muted uppercase tracking-wide">Channel</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-dc-input text-dc-text rounded px-3 py-2 text-sm outline-none border border-transparent focus:border-dc-accent"
          required
        >
          <option value="">Select a channel…</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.name}>#{r.name}</option>
          ))}
        </select>
      </div>
      <Input
        label='Type "DELETE" to confirm'
        placeholder="DELETE"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button
        type="submit"
        variant="danger"
        loading={loading}
        disabled={confirm !== 'DELETE' || !selected}
        className="w-full"
      >
        Clear All Messages
      </Button>
    </form>
  )
}
