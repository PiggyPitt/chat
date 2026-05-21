import { useEffect, useState } from 'react'
import { listPending, approveUser, rejectUser } from '@/api/admin'
import { useUIStore } from '@/store/useUIStore'
import type { PendingUser } from '@/types'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function PendingUsersList() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    listPending()
      .then(setUsers)
      .catch(() => addToast('Failed to load pending users', 'error'))
      .finally(() => setLoading(false))
  }, [addToast])

  async function handleApprove(user: PendingUser) {
    setActionId(user.id)
    try {
      await approveUser(user.id)
      setUsers((u) => u.filter((x) => x.id !== user.id))
      addToast(`${user.username} approved`, 'success')
    } catch {
      addToast('Failed to approve user', 'error')
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(user: PendingUser) {
    setActionId(user.id)
    try {
      await rejectUser(user.id)
      setUsers((u) => u.filter((x) => x.id !== user.id))
      addToast(`${user.username} rejected`, 'success')
    } catch {
      addToast('Failed to reject user', 'error')
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner /></div>
  }

  if (users.length === 0) {
    return <p className="text-dc-muted text-sm text-center py-8">No pending registrations</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3 bg-dc-input rounded px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-dc-active flex items-center justify-center text-dc-muted text-sm font-medium shrink-0">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dc-text">{user.username}</p>
            <p className="text-xs text-dc-muted">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button
              variant="primary"
              onClick={() => handleApprove(user)}
              loading={actionId === user.id}
              className="py-1 px-2 text-xs"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() => handleReject(user)}
              loading={actionId === user.id}
              className="py-1 px-2 text-xs"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
