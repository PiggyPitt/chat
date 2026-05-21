import { FormEvent, useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useRoom } from '@/hooks/useRoom'

export default function PasswordModal() {
  const open = useUIStore((s) => s.showPasswordModal)
  const roomName = useUIStore((s) => s.pendingJoinRoomName)
  const closePasswordModal = useUIStore((s) => s.closePasswordModal)
  const { join } = useRoom()

  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // focus input when modal opens + reset state
  useEffect(() => {
    if (open) {
      setPassword('')
      setShow(false)
      setShake(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!roomName || !password) return
    setLoading(true)
    try {
      await join(roomName, password)
      closePasswordModal()
      setPassword('')
    } catch {
      // shake animation on wrong password
      setShake(true)
      setPassword('')
      setTimeout(() => {
        setShake(false)
        inputRef.current?.focus()
      }, 500)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    closePasswordModal()
    setPassword('')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'modal-in 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-dc-accent via-purple-500 to-pink-500" />

        <div className="px-8 py-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              {/* pulse ring */}
              <span className="absolute inset-0 rounded-2xl border border-dc-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-[#e6edf3] text-xl font-semibold mb-1">
            Protected channel
          </h2>
          <p className="text-center text-[#8b949e] text-sm mb-6">
            Enter the password to join{' '}
            <span className="text-[#e6edf3] font-mono font-medium">#{roomName}</span>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Password input */}
            <div
              className={`relative rounded-lg overflow-hidden transition-all duration-150 ${shake ? 'animate-shake' : ''}`}
              style={{ boxShadow: shake ? '0 0 0 2px #f23f42' : undefined }}
            >
              <div
                className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg focus-within:border-dc-accent focus-within:ring-1 focus-within:ring-dc-accent/40 transition-all duration-150"
              >
                {/* lock icon inside input */}
                <span className="pl-3 text-[#484f58] shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Channel password"
                  autoComplete="off"
                  className="flex-1 bg-transparent text-[#e6edf3] text-sm px-3 py-3 outline-none placeholder-[#484f58] font-mono tracking-widest"
                  required
                />
                {/* show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  tabIndex={-1}
                  className="pr-3 text-[#484f58] hover:text-[#8b949e] transition-colors shrink-0"
                >
                  {show ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 rounded-lg bg-dc-accent hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Joining…
                </>
              ) : 'Join Channel'}
            </button>
          </form>

          {/* Cancel */}
          <button
            onClick={handleClose}
            className="mt-4 w-full text-center text-xs text-[#484f58] hover:text-[#8b949e] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
