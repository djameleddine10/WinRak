import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Shield, KeyRound, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { Logo } from '../components/Logo'
import { toast } from 'sonner'

type Step = 'email' | 'otp'

export default function Login() {
  const [step,    setStep]    = useState<Step>('email')
  const [email,   setEmail]   = useState('')
  const [token,   setToken]   = useState('')
  const { sendOtp, verifyOtp, loading } = useAuthStore()
  const navigate = useNavigate()

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await sendOtp(email)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Code envoyé — vérifiez votre boîte mail')
      setStep('otp')
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await verifyOtp(email, token)
    if (error) {
      toast.error(error)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-winrak/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(#6366F1 1px, transparent 1px), linear-gradient(90deg, #6366F1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md px-6">
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-card">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" variant="full" />
            <div className="mt-4 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              <Shield size={12} className="text-primary" />
              <span className="text-xs text-primary font-medium">Accès Administrateur</span>
            </div>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@winrak.dz"
                    className="input-field pl-9"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer le code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-text-secondary text-center">
                Code envoyé à <span className="text-text-primary font-medium">{email}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Code de vérification
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="input-field pl-9 tracking-widest text-center text-lg font-mono"
                    required
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || token.length < 6}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setToken('') }}
                className="w-full text-xs text-muted hover:text-text-primary transition-colors text-center"
              >
                ← Changer d'adresse email
              </button>
            </form>
          )}

          <p className="text-center text-xs text-muted mt-6">
            WinRak Admin Panel — Usage interne uniquement
          </p>
        </div>

        <p className="text-center text-xs text-muted/50 mt-4">v1.0.0 · 2026</p>
      </div>
    </div>
  )
}
