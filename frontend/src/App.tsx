import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import PendingPage from '@/pages/PendingPage'
import ChatPage from '@/pages/ChatPage'
import { useAuthStore } from '@/store/useAuthStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/chat" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestRoute><LoginPage /></GuestRoute>,
  },
  {
    path: '/register',
    element: <GuestRoute><RegisterPage /></GuestRoute>,
  },
  {
    path: '/pending',
    element: <PendingPage />,
  },
  {
    path: '/chat',
    element: <ProtectedRoute><ChatPage /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/chat" replace />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
