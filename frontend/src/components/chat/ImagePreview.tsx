import { useState } from 'react'

interface Props {
  url: string
  alt?: string
}

export default function ImagePreview({ url, alt = 'image' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex items-center gap-2 w-fit max-w-xs mt-1 px-3 py-2 rounded bg-dc-input text-dc-muted text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
          <line x1="3" y1="21" x2="21" y2="3" />
        </svg>
        <span>Image failed to load</span>
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt={alt}
        className="max-w-xs max-h-64 rounded object-contain cursor-pointer hover:opacity-90 transition-opacity mt-1"
        onError={() => setFailed(true)}
      />
    </a>
  )
}
