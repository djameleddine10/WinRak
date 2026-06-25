import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-winrak to-yellow-500 flex items-center justify-center animate-pulse">
            <span className="font-black text-winrak-dark text-sm">WR</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
