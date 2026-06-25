import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-card fade-in">
        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
          variant === 'danger' ? 'bg-danger/10' : 'bg-warning/10'
        }`}>
          <AlertTriangle className={variant === 'danger' ? 'text-danger' : 'text-warning'} size={22} />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 flex items-center ${
              variant === 'danger'
                ? 'bg-danger text-white hover:bg-red-600'
                : 'bg-warning text-white hover:bg-yellow-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
