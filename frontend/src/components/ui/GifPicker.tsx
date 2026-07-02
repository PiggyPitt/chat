import { useEffect, useRef, useState } from 'react'
import { searchGifs, trendingGifs } from '@/api/gif'
import type { GifResult } from '@/types'
import Spinner from './Spinner'

interface GifPickerProps {
  onSelect: (gif: GifResult) => void
  onClose: () => void
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    const fetchGifs = query.trim() ? searchGifs(query.trim()) : trendingGifs()
    const timer = setTimeout(() => {
      fetchGifs
        .then((results) => {
          if (!cancelled) setGifs(results)
        })
        .catch(() => {
          if (!cancelled) setError(true)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, query.trim() ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-2 left-0 z-50 w-80 h-96 bg-dc-sidebar border border-dc-border rounded-lg shadow-xl flex flex-col overflow-hidden"
    >
      <div className="p-2 border-b border-dc-border shrink-0">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs"
          className="w-full bg-dc-input text-dc-text text-sm rounded px-3 py-1.5 outline-none placeholder-dc-muted/60"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={24} />
          </div>
        ) : error ? (
          <p className="text-xs text-dc-muted text-center mt-8">GIF search is unavailable right now.</p>
        ) : gifs.length === 0 ? (
          <p className="text-xs text-dc-muted text-center mt-8">No GIFs found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => {
                  onSelect(gif)
                  onClose()
                }}
                className="rounded overflow-hidden hover:opacity-80 transition-opacity bg-dc-input"
              >
                <img src={gif.previewUrl} alt="" className="w-full h-24 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
