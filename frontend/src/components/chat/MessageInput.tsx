import { KeyboardEvent, useRef, useState } from 'react'
import { sendMessage, sendImage } from '@/socket/socketClient'
import { uploadImage } from '@/api/upload'
import { toggleMuteRoom } from '@/api/push'
import { useRoomStore } from '@/store/useRoomStore'
import { useUIStore } from '@/store/useUIStore'
import Spinner from '@/components/ui/Spinner'
import EmojiPicker from '@/components/ui/EmojiPicker'
import GifPicker from '@/components/ui/GifPicker'
import type { GifResult } from '@/types'

export default function MessageInput() {
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const activeRoomName = useRoomStore((s) => s.activeRoomName)
  const setMuted = useRoomStore((s) => s.setMuted)
  const addToast = useUIStore((s) => s.addToast)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorRef = useRef<number>(0)

  async function handleSend() {
    if (!activeRoomId || !text.trim()) return
    const content = text.trim()

    if (content === '/mute') {
      setText('')
      try {
        const { muted } = await toggleMuteRoom(activeRoomId)
        setMuted(activeRoomId, muted)
        addToast(`Notifications ${muted ? 'muted' : 'unmuted'} for this room`, 'success')
      } catch {
        addToast('Failed to toggle mute', 'error')
      }
      return
    }

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

  async function handleGifSelect(gif: GifResult) {
    if (!activeRoomId) return
    try {
      await sendImage(activeRoomId, gif.url)
    } catch (err: unknown) {
      addToast((err as Error).message ?? 'Failed to send GIF', 'error')
    }
  }

  function handleEmojiButtonClick() {
    // Save cursor position before panel opens and textarea loses focus
    cursorRef.current = textareaRef.current?.selectionStart ?? text.length
    setShowEmoji(true)
  }

  function insertEmoji(emoji: string) {
    const pos = cursorRef.current
    const next = text.slice(0, pos) + emoji + text.slice(pos)
    setText(next)
    // Restore cursor after the inserted emoji
    const nextPos = pos + emoji.length
    cursorRef.current = nextPos
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(nextPos, nextPos)
      }
    })
  }

  if (!activeRoomId) return null

  return (
    <div className="px-2 sm:px-4 pb-4">
      <div className="relative bg-dc-input rounded-lg flex items-end gap-1 sm:gap-2 px-2 sm:px-3 py-2">
        {/* upload image */}
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

        {/* emoji button + panel */}
        <div className="relative shrink-0">
          <button
            onClick={handleEmojiButtonClick}
            title="Emoji"
            className={`transition-colors p-1 mb-0.5 ${showEmoji ? 'text-dc-text' : 'text-dc-muted hover:text-dc-text'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={insertEmoji}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        {/* gif button + panel */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowGif((v) => !v)}
            title="GIF"
            className={`transition-colors mb-0.5 w-[26px] h-[26px] flex items-center justify-center text-[10px] font-extrabold leading-none rounded ${showGif ? 'text-dc-text' : 'text-dc-muted hover:text-dc-text'}`}
          >
            GIF
          </button>
          {showGif && (
            <GifPicker
              onSelect={handleGifSelect}
              onClose={() => setShowGif(false)}
            />
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${activeRoomName}`}
          rows={1}
          className="flex-1 bg-transparent text-dc-text text-sm placeholder-dc-muted/60 outline-none resize-none max-h-32 leading-relaxed py-1"
          style={{ scrollbarWidth: 'thin' }}
        />

        {/* send */}
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
