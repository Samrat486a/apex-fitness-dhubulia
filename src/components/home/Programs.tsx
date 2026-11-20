import { ArrowRight, ArrowUpRight, CalendarDays, Gauge, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PROGRAMS, srcSet, type Program, type ProgramCategory } from '../../config/site'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/Misc'

const TABS: ('All' | ProgramCategory)[] = ['All', 'Strength', 'Conditioning', 'Mind & Body', 'Coaching']

export function IntensityBars({ value, dark }: { value: number; dark?: boolean }) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-label={`Intensity ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-1.5 rounded-sm ${n <= value ? 'bg-cyan-400' : dark ? 'bg-white/15' : 'bg-ink/10'}`} style={{ height: `${6 + n * 2.5}px` }} />
      ))}
    </span>
  )
}

export function ProgramCard({ p }: { p: Program }) {
  return (
    <Link
      to={`/programs/${p.slug}`}
      className="group card flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgb(6_182_212/0.55)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        <img
          src={p.image}
          srcSet={srcSet(p.image, [480, 800])}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          alt={p.title}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/5 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
        <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 font-mono text-[10.5px] font-semibold tracking-wider text-ink uppercase">{p.category}</span>
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1.5 text-[10.5px] font-semibold text-white ring-1 ring-white/15">
          <IntensityBars value={p.intensity} dark />
        </span>
        <p className="absolute inset-x-4 bottom-4 translate-y-3 text-sm leading-snug font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {p.tagline}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-wide text-xl font-extrabold tracking-tight uppercase transition-colors duration-500 group-hover:text-cyan-700">{p.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.summary}</p>
        <div className="mt-5 mb-6 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium text-ink/70">
          <span className="inline-flex items-center gap-1.5"><Gauge className="size-4 text-cyan-600" />{p.level}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-cyan-600" />{p.sessions}</span>
          <span className="inline-flex items-center gap-1.5"><Timer className="size-4 text-cyan-600" />{p.duration}</span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-5">
          <span className="text-[13px] font-semibold text-ink/55">Included with membership</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
            Explore
            <span className="grid size-8 place-items-center rounded-full bg-canvas ring-1 ring-line transition-all duration-500 group-hover:rotate-45 group-hover:bg-cyan-400 group-hover:ring-cyan-400">
              <ArrowUpRight className="size-4" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function Programs({ limit, showAll = true }: { limit?: number; showAll?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const list = PROGRAMS.filter((p) => tab === 'All' || p.category === tab).slice(0, limit)
  return (
    <section className="relative border-y border-line bg-canvas-2/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <SectionHeading
          eyebrow="Training programs"
          title="Find your"
          accent="training lane."
          text="Coach-designed programs for every goal — all included with your Apex membership. Tap a program to see exactly how it works."
          action={showAll ? <Button to="/programs" variant="outline" arrow>All programs</Button> : undefined}
        />
        <div className="reveal scrollbar-none -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4.5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                tab === t ? 'bg-ink text-white shadow-[0_8px_20px_-10px_rgb(10_14_17/0.7)]' : 'border border-line bg-white text-ink/65 hover:-translate-y-0.5 hover:border-cyan-500/50 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div key={tab} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <div key={p.slug} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <ProgramCard p={p} />
            </div>
          ))}
        </div>
        {limit && limit < PROGRAMS.length && tab === 'All' && (
          <div className="mt-10 flex justify-center">
            <Link to="/programs" className="group inline-flex items-center gap-2 text-sm font-bold text-ink">
              <span className="link-u">See all {PROGRAMS.length} programs</span>
              <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
