import { FormEvent, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createRoom } from '@/api/rooms'
import { useUIStore } from '@/store/useUIStore'
import { useRoomStore } from '@/store/useRoomStore'
import { useRoom } from '@/hooks/useRoom'

export default function CreateRoomModal() {
  const open = useUIStore((s) => s.showCreateRoom)
  const setShowCreateRoom = useUIStore((s) => s.setShowCreateRoom)
  const addToast = useUIStore((s) => s.addToast)
  const addRoom = useRoomStore((s) => s.addRoom)
  const { join } = useRoom()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const room = await createRoom(name.trim(), password || undefined)
      addRoom(room)
      setShowCreateRoom(false)
      setName('')
      setPassword('')
      await join(room.name, password || undefined)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      addToast(msg ?? 'Failed to create channel', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setShowCreateRoom(false)
    setName('')
    setPassword('')
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create a Channel">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
        <Input
          label="Channel Name"
          placeholder="e.g. general"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <Input
          label="Password (optional)"
          type="password"
          placeholder="Leave blank for public channel"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2 justify-end mt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Channel</Button>
        </div>
      </form>
    </Modal>
  )
}
