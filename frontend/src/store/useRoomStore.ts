import { create } from 'zustand'
import type { Room } from '@/types'

interface RoomState {
  rooms: Room[]
  activeRoomId: string | null
  activeRoomName: string | null
  // In-memory only (never persisted) — lets a dropped socket silently rejoin the same
  // room on reconnect without re-prompting the user, without the server ever skipping
  // password verification itself.
  activeRoomPassword: string | null
  mutedRoomIds: Set<string>
  setRooms: (rooms: Room[]) => void
  addRoom: (room: Room) => void
  setActiveRoom: (id: string, name: string, password?: string) => void
  clearActiveRoom: () => void
  setMuted: (roomId: string, muted: boolean) => void
  isMuted: (roomId: string) => boolean
}

export const useRoomStore = create<RoomState>()((set, get) => ({
  rooms: [],
  activeRoomId: null,
  activeRoomName: null,
  activeRoomPassword: null,
  mutedRoomIds: new Set(),
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms.filter((r) => r.id !== room.id), room] })),
  setActiveRoom: (id, name, password) => set({ activeRoomId: id, activeRoomName: name, activeRoomPassword: password ?? null }),
  clearActiveRoom: () => set({ activeRoomId: null, activeRoomName: null, activeRoomPassword: null }),
  setMuted: (roomId, muted) =>
    set((s) => {
      const next = new Set(s.mutedRoomIds)
      muted ? next.add(roomId) : next.delete(roomId)
      return { mutedRoomIds: next }
    }),
  isMuted: (roomId) => get().mutedRoomIds.has(roomId),
}))
