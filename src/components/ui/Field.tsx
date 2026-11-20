import { ChevronDown } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const control =
  'w-full rounded-2xl border bg-white px-4 text-[15px] text-ink placeholder:text-ink/35 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-400/15 disabled:bg-canvas disabled:text-muted'
const ok = 'border-line hover:border-ink/20'
const bad = 'border-red-400 focus:border-red-500 focus:ring-red-400/15'

interface FieldProps {
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  icon?: ReactNode
  className?: string
}

function Shell({ id, label, error, hint, required, className = '', children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-ink/80">
        {label}
        {required && <span className="text-cyan-600">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ label, error, hint, required, icon, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink/40 [&>svg]:size-[18px]">{icon}</span>}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`${control} h-12 ${icon ? 'pl-11' : ''} ${error ? bad : ok}`}
          {...rest}
        />
      </div>
    </Shell>
  )
}

export function Select({ label, error, hint, required, className, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <select id={id} aria-invalid={!!error} className={`${control} h-12 cursor-pointer appearance-none pr-10 ${error ? bad : ok}`} {...rest}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink/45" />
      </div>
    </Shell>
  )
}

export function Textarea({ label, error, hint, required, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea id={id} aria-invalid={!!error} className={`${control} min-h-28 resize-y py-3 ${error ? bad : ok}`} {...rest} />
    </Shell>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-cyan-500' : 'bg-ink/15'}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
}

export function Checkbox({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-md accent-cyan-500"
        />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 text-[13px] font-medium text-red-600">{error}</p>}
    </div>
  )
}
