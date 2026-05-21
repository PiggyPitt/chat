import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function PendingPage() {
  const username = sessionStorage.getItem('pendingUsername') ?? 'you'
  const navigate = useNavigate()

  function handleBack() {
    sessionStorage.removeItem('pendingUsername')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dc-bg flex items-center justify-center">
      <div className="bg-dc-sidebar rounded-lg shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-dc-text mb-2">Awaiting Approval</h1>
        <p className="text-dc-muted text-sm mb-1">
          Hi <span className="text-dc-text font-medium">{username}</span>,
        </p>
        <p className="text-dc-muted text-sm mb-6">
          Your account is pending admin approval. Please check back later.
        </p>
        <Button variant="ghost" onClick={handleBack} className="w-full">
          Back to Login
        </Button>
      </div>
    </div>
  )
}
