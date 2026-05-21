import { create } from 'zustand'
import type { Room } from '@/types'

interface RoomState {
  rooms: Room[]
  activeRoomId: string | null
  activeRoomName: string | null
  setRooms: (rooms: Room[]) => void
  addRoom: (room: Room) => void
  setActiveRoom: (id: string, name: string) => void
  clearActiveRoom: () => void
}

export const useRoomStore = create<RoomState>()((set) => ({
  rooms: [],
  activeRoomId: null,
  activeRoomName: null,
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms.filter((r) => r.id !== room.id), room] })),
  setActiveRoom: (id, name) => set({ activeRoomId: id, activeRoomName: name }),
  clearActiveRoom: () => set({ activeRoomId: null, activeRoomName: null }),
}))
