import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/useAuthStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      setAuth(data)
      navigate('/chat')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Username"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-dc-red text-sm">{error}</p>}
      <Button type="submit" loading={loading} className="w-full mt-1">
        Log In
      </Button>
      <p className="text-dc-muted text-sm text-center">
        Don't have an account?{' '}
        <Link to="/register" className="text-dc-accent hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}
