import { useEffect, useRef } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div ref={containerRef} className="absolute bottom-full mb-2 left-0 z-50">
      <Picker
        data={data}
        theme="dark"
        onEmojiSelect={(emoji: { native: string }) => {
          onSelect(emoji.native)
          onClose()
        }}
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
      />
    </div>
  )
}
