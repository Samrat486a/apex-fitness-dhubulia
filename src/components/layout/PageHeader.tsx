import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({ eyebrow, title, accent, text, crumb, children }: { eyebrow: string; title: string; accent?: string; text?: string; crumb: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 right-0 size-[30rem] rounded-full glow-cyan" />
      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6 sm:pt-12 sm:pb-20 lg:px-8">
        <nav className="flex animate-fade-up items-center gap-1.5 text-[13px] font-medium text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-ink">{crumb}</span>
        </nav>
        <p className="eyebrow mt-8 animate-fade-up [animation-delay:60ms]">{eyebrow}</p>
        <h1 className="font-wide mt-4 max-w-4xl animate-fade-up text-[40px] leading-[0.95] font-black tracking-[-0.04em] uppercase [animation-delay:120ms] sm:text-6xl lg:text-7xl">
          {title} {accent && <span className="text-apex">{accent}</span>}
        </h1>
        {text && <p className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-ink/65 [animation-delay:180ms]">{text}</p>}
        {children && <div className="mt-8 animate-fade-up [animation-delay:240ms]">{children}</div>}
      </div>
    </section>
  )
}
