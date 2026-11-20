import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ReactNode } from 'react'

export function AdminHeader({ title, text, actions, eyebrow = 'Admin' }: { title: string; text?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-7 flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-wide mt-2.5 text-3xl font-black tracking-tight uppercase sm:text-[38px]">{title}</h1>
        {text && <p className="mt-1.5 max-w-2xl text-sm text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink/40" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-line bg-white pr-4 pl-10 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-400/15"
      />
    </div>
  )
}

export function FilterChips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="scrollbar-none flex w-full max-w-full min-w-0 gap-1.5 overflow-x-auto sm:flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-300 ${value === o.value ? 'bg-ink text-white' : 'bg-white text-ink/65 ring-1 ring-line hover:text-ink hover:ring-ink/20'}`}
        >
          {o.label}
          {o.count !== undefined && <span className={`ml-1.5 ${value === o.value ? 'text-cyan-300' : 'text-ink/40'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function MiniSelect({ value, onChange, children, label }: { value: string; onChange: (v: string) => void; children: ReactNode; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-semibold outline-none focus:border-cyan-500"
    >
      {children}
    </select>
  )
}

export function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return <p className="px-5 py-4 text-[13px] text-muted sm:px-6">{total} result{total === 1 ? '' : 's'}</p>
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-6">
      <p className="text-[13px] text-muted">
        Page {page} of {pages} · {total} results
      </p>
      <div className="flex gap-1.5">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid size-9 place-items-center rounded-full border border-line bg-white disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid size-9 place-items-center rounded-full border border-line bg-white disabled:opacity-40" aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function KpiCard({ label, value, icon, tone = 'light', sub, delay = 0 }: { label: string; value: number | string; icon: ReactNode; tone?: 'light' | 'dark' | 'cyan' | 'amber' | 'red'; sub?: string; delay?: number }) {
  const styles = {
    light: 'card',
    dark: 'rounded-3xl bg-ink text-white',
    cyan: 'rounded-3xl bg-cyan-400 text-ink',
    amber: 'card',
    red: 'card',
  }[tone]
  const iconCls = {
    light: 'bg-canvas text-ink ring-1 ring-line',
    dark: 'bg-white/10 text-cyan-300',
    cyan: 'bg-ink text-cyan-300',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-600',
  }[tone]
  return (
    <div className={`${styles} animate-fade-up p-5 transition-all duration-500 hover:-translate-y-0.5`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <p className={`text-[13px] font-semibold ${tone === 'dark' ? 'text-white/60' : tone === 'cyan' ? 'text-ink/70' : 'text-muted'}`}>{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl [&>svg]:size-4 ${iconCls}`}>{icon}</span>
      </div>
      <p className="font-wide mt-3 text-4xl font-black tracking-tight">{value}</p>
      {sub && <p className={`mt-1 text-[12.5px] ${tone === 'dark' ? 'text-white/50' : tone === 'cyan' ? 'text-ink/65' : 'text-muted'}`}>{sub}</p>}
    </div>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'size-16 text-lg rounded-2xl' : size === 'sm' ? 'size-8 text-[11px] rounded-lg' : 'size-10 text-xs rounded-xl'
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return <span className={`grid shrink-0 place-items-center bg-ink font-bold text-cyan-300 ${cls}`}>{letters}</span>
}
