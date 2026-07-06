import type { ReactNode } from 'react'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const URL_RE = /(https?:\/\/[^\s<]+)/gi

function isSafeUrl(url: string): boolean {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

export function linkify(text: string): ReactNode[] {
  const parts = text.split(URL_RE)
  return parts.map((part, i) => {
    if (i % 2 === 1 && isSafeUrl(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-dc-accent hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return part
  })
}
