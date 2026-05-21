import { KeyboardEvent, useRef, useState } from 'react'
import { sendMessage, sendImage } from '@/socket/socketClient'
import { uploadImage } from '@/api/upload'
import { useRoomStore } from '@/store/useRoomStore'
import { useUIStore } from '@/store/useUIStore'
import Spinner from '@/components/ui/Spinner'

export default function MessageInput() {
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const activeRoomName = useRoomStore((s) => s.activeRoomName)
  const addToast = useUIStore((s) => s.addToast)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSend() {
    if (!activeRoomId || !text.trim()) return
    const content = text.trim()
    setText('')
    try {
      await sendMessage(activeRoomId, content)
    } catch (err: unknown) {
      addToast((err as Error).message ?? 'Failed to send message', 'error')
      setText(content)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeRoomId) return
    e.target.value = ''
    setUploading(true)
    try {
      const { publicUrl } = await uploadImage(file)
      await sendImage(activeRoomId, publicUrl)
    } catch (err: unknown) {
      addToast((err as Error).message ?? 'Failed to upload image', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (!activeRoomId) return null

  return (
    <div className="px-4 pb-4">
      <div className="bg-dc-input rounded-lg flex items-end gap-2 px-3 py-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Upload image"
          className="text-dc-muted hover:text-dc-text transition-colors p-1 shrink-0 mb-0.5 disabled:opacity-50"
        >
          {uploading ? (
            <Spinner size={18} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${activeRoomName}`}
          rows={1}
          className="flex-1 bg-transparent text-dc-text text-sm placeholder-dc-muted/60 outline-none resize-none max-h-32 leading-relaxed py-1"
          style={{ scrollbarWidth: 'thin' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send message"
          className="text-dc-muted hover:text-dc-text transition-colors p-1 shrink-0 mb-0.5 disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
