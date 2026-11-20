import { AlertTriangle, Loader2, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`size-5 animate-spin text-cyan-500 ${className}`} />
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-ink/[0.06] ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-7" />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle className="size-6" />
      </span>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink/25">
          <RotateCw className="size-4" /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-canvas text-ink/50 ring-1 ring-line [&>svg]:size-6">{icon}</span>
      <div>
        <p className="font-display text-base font-bold">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
      </div>
      {action}
    </div>
  )
}

/** Section header: eyebrow + headline (+ optional accent line) + supporting text, with an optional action. */
export function SectionHeading({ eyebrow, title, accent, text, action, align = 'left', dark }: { eyebrow: string; title: string; accent?: string; text?: string; action?: ReactNode; align?: 'left' | 'center'; dark?: boolean }) {
  return (
    <div className={`reveal flex flex-col gap-6 ${align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-2xl'}>
        <p className={`eyebrow ${dark ? 'text-white/55' : ''}`}>{eyebrow}</p>
        <h2 className={`font-wide mt-4 text-[34px] leading-[1.02] font-extrabold tracking-[-0.03em] uppercase sm:text-5xl ${dark ? 'text-white' : ''}`}>
          {title}
          {accent && (
            <>
              <br />
              <span className="text-apex">{accent}</span>
            </>
          )}
        </h2>
        {text && <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? 'text-white/65' : 'text-muted'}`}>{text}</p>}
      </div>
      {action}
    </div>
  )
}
