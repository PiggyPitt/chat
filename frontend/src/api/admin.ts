import client from './client'
import type { PendingUser } from '@/types'

export async function listPending(): Promise<PendingUser[]> {
  const res = await client.get('/admin/pending')
  return res.data.users
}

export async function approveUser(target: string): Promise<void> {
  await client.post(`/admin/approve/${encodeURIComponent(target)}`)
}

export async function rejectUser(target: string): Promise<void> {
  await client.post(`/admin/reject/${encodeURIComponent(target)}`)
}

export async function clearRoomMessages(roomName: string): Promise<{ deletedCount: number }> {
  const res = await client.delete(`/admin/rooms/${encodeURIComponent(roomName)}/messages`)
  return res.data
}
