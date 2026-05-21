import client from './client'
import type { Room } from '@/types'

export async function listRooms(): Promise<Room[]> {
  const res = await client.get('/rooms')
  return res.data.rooms
}

export async function createRoom(name: string, password?: string): Promise<Room> {
  const res = await client.post('/rooms', { name, password })
  return res.data.room
}
