import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types'

interface AuthState {
  token: string | null
  userId: string | null
  username: string | null
  role: UserRole | null
  setAuth: (payload: { token: string; userId: string; username: string; role: UserRole }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      role: null,
      setAuth: (payload) => set(payload),
      clearAuth: () => set({ token: null, userId: null, username: null, role: null }),
    }),
    { name: 'auth-storage' }
  )
)
