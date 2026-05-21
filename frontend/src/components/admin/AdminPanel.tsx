import { useState } from 'react'
import { useUIStore } from '@/store/useUIStore'
import PendingUsersList from './PendingUsersList'
import ClearRoomMessages from './ClearRoomMessages'

type Tab = 'pending' | 'clear'

export default function AdminPanel() {
  const open = useUIStore((s) => s.showAdminPanel)
  const setShowAdminPanel = useUIStore((s) => s.setShowAdminPanel)
  const [tab, setTab] = useState<Tab>('pending')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={() => setShowAdminPanel(false)} />
      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md bg-dc-sidebar h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dc-border">
          <h2 className="text-base font-semibold text-dc-text">Admin Panel</h2>
          <button
            onClick={() => setShowAdminPanel(false)}
            className="text-dc-muted hover:text-dc-text transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dc-border px-5">
          {(['pending', 'clear'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-1 mr-4 text-sm font-medium border-b-2 transition-colors
                ${tab === t ? 'border-dc-accent text-dc-text' : 'border-transparent text-dc-muted hover:text-dc-text'}`}
            >
              {t === 'pending' ? 'Pending Users' : 'Clear Messages'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'pending' ? <PendingUsersList /> : <ClearRoomMessages />}
        </div>
      </div>
    </div>
  )
}
