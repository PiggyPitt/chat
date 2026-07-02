import { create } from 'zustand'
import type { Room } from '@/types'

interface RoomState {
  rooms: Room[]
  activeRoomId: string | null
  activeRoomName: string | null
  mutedRoomIds: Set<string>
  setRooms: (rooms: Room[]) => void
  addRoom: (room: Room) => void
  setActiveRoom: (id: string, name: string) => void
  clearActiveRoom: () => void
  setMuted: (roomId: string, muted: boolean) => void
  isMuted: (roomId: string) => boolean
}

export const useRoomStore = create<RoomState>()((set, get) => ({
  rooms: [],
  activeRoomId: null,
  activeRoomName: null,
  mutedRoomIds: new Set(),
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms.filter((r) => r.id !== room.id), room] })),
  setActiveRoom: (id, name) => set({ activeRoomId: id, activeRoomName: name }),
  clearActiveRoom: () => set({ activeRoomId: null, activeRoomName: null }),
  setMuted: (roomId, muted) =>
    set((s) => {
      const next = new Set(s.mutedRoomIds)
      muted ? next.add(roomId) : next.delete(roomId)
      return { mutedRoomIds: next }
    }),
  isMuted: (roomId) => get().mutedRoomIds.has(roomId),
}))
