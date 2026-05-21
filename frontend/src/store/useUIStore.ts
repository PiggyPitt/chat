import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'error' | 'success'
}

interface UIState {
  showCreateRoom: boolean
  showAdminPanel: boolean
  showPasswordModal: boolean
  pendingJoinRoomName: string | null
  sidebarOpen: boolean
  rightSidebarOpen: boolean
  toasts: Toast[]
  setShowCreateRoom: (v: boolean) => void
  setShowAdminPanel: (v: boolean) => void
  openPasswordModal: (roomName: string) => void
  closePasswordModal: () => void
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void
  setRightSidebarOpen: (v: boolean) => void
  toggleRightSidebar: () => void
  addToast: (message: string, type: 'error' | 'success') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  showCreateRoom: false,
  showAdminPanel: false,
  showPasswordModal: false,
  pendingJoinRoomName: null,
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  rightSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  toasts: [],
  setShowCreateRoom: (v) => set({ showCreateRoom: v }),
  setShowAdminPanel: (v) => set({ showAdminPanel: v }),
  openPasswordModal: (roomName) => set({ showPasswordModal: true, pendingJoinRoomName: roomName }),
  closePasswordModal: () => set({ showPasswordModal: false, pendingJoinRoomName: null }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setRightSidebarOpen: (v) => set({ rightSidebarOpen: v }),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  addToast: (message, type) =>
    set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
