import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dc-bg flex items-center justify-center">
      <div className="bg-dc-sidebar rounded-lg shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-dc-text mb-1 text-center">Welcome back!</h1>
        <p className="text-dc-muted text-sm text-center mb-6">Sign in to continue chatting</p>
        <LoginForm />
      </div>
    </div>
  )
}
