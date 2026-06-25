interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
}

export function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon */}
      <div
        style={{ width: s.icon, height: s.icon }}
        className="rounded-xl bg-gradient-to-br from-winrak to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-lg"
      >
        <span
          className="font-black text-winrak-dark leading-none"
          style={{ fontSize: s.icon * 0.38 }}
        >
          WR
        </span>
      </div>

      {/* Text */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className={`${s.text} font-black text-text-primary tracking-tight`}>
            Win<span className="text-winrak">Rak</span>
          </span>
          <span className="text-[9px] text-muted font-medium uppercase tracking-widest">
            Admin Panel
          </span>
        </div>
      )}
    </div>
  )
}

export function Watermark() {
  return (
    <div className="watermark select-none pointer-events-none">WR</div>
  )
}
