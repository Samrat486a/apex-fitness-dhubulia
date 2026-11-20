import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: Tone
  title: string
  body?: string
  leaving?: boolean
}

interface ToastApi {
  success: (title: string, body?: string) => void
  error: (title: string, body?: string) => void
  info: (title: string, body?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const ICON = { success: CheckCircle2, error: XCircle, info: Info }
const TONE = {
  success: 'text-cyan-500',
  error: 'text-red-500',
  info: 'text-white/70',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 220)
  }, [])

  const push = useCallback(
    (tone: Tone, title: string, body?: string) => {
      const id = ++seq.current
      setToasts((t) => [...t.slice(-3), { id, tone, title, body }])
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 4200)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, b) => push('success', t, b),
      error: (t, b) => push('error', t, b),
      info: (t, b) => push('info', t, b),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
      >
        {toasts.map((t) => {
          const Icon = ICON[t.tone]
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-ink/95 px-4 py-3.5 text-white shadow-lift backdrop-blur transition-all duration-200 ${
                t.leaving ? 'translate-y-2 opacity-0' : 'animate-slide-in-right'
              }`}
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${TONE[t.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[13px] leading-snug text-white/65">{t.body}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="-m-1 rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
