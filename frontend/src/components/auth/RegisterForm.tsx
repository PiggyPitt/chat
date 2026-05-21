import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '@/api/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const data = await register(username, password)
      // registration succeeds but no token — store username for pending page, do NOT setAuth
      sessionStorage.setItem('pendingUsername', data.username)
      navigate('/pending')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Username"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Choose a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      {error && <p className="text-dc-red text-sm">{error}</p>}
      <Button type="submit" loading={loading} className="w-full mt-1">
        Create Account
      </Button>
      <p className="text-dc-muted text-sm text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-dc-accent hover:underline">
          Log In
        </Link>
      </p>
    </form>
  )
}
