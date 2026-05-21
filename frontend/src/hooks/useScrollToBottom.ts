import { useRef, useEffect } from 'react'

export function useScrollToBottom<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
