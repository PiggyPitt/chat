import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-dc-muted uppercase tracking-wide">{label}</label>}
      <input
        {...props}
        className={`bg-dc-input text-dc-text rounded px-3 py-2 text-sm outline-none border border-transparent focus:border-dc-accent placeholder-dc-muted/60 ${error ? 'border-dc-red' : ''} ${className}`}
      />
      {error && <span className="text-xs text-dc-red">{error}</span>}
    </div>
  )
}
