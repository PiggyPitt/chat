import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({
  id, message, type, onRemove,
}: { id: string; message: string; type: 'error' | 'success'; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  return (
    <div
      className={`px-4 py-3 rounded shadow-lg text-sm text-white max-w-xs cursor-pointer
        ${type === 'error' ? 'bg-dc-red' : 'bg-dc-green'}`}
      onClick={() => onRemove(id)}
    >
      {message}
    </div>
  )
}
