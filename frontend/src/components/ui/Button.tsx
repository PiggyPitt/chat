import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'danger' | 'ghost' | 'secondary'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-dc-accent hover:bg-indigo-500 text-white',
  danger: 'bg-dc-red hover:bg-red-500 text-white',
  ghost: 'bg-transparent hover:bg-dc-hover text-dc-text',
  secondary: 'bg-dc-input hover:bg-dc-hover text-dc-text',
}

export default function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? <span className="opacity-70">Loading…</span> : children}
    </button>
  )
}
