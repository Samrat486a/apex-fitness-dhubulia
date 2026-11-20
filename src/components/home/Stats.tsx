import { CalendarDays, Clock3, Dumbbell, Users } from 'lucide-react'
import { STATS } from '../../config/site'
import { useCountUp } from '../../lib/hooks'
import { SectionHeading } from '../ui/Misc'

const ICONS = [Users, Dumbbell, CalendarDays, Clock3]

function StatCard({ i }: { i: number }) {
  const s = STATS[i]!
  const { ref, value } = useCountUp(s.value)
  const Icon = ICONS[i]!
  const featured = i === 0
  return (
    <div
      style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
      className={`reveal group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1.5 sm:p-7 ${
        featured ? 'card-dark bg-ink shadow-lift sm:row-span-2' : 'card hover:shadow-lift'
      }`}
    >
      {featured && <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-70" />}
      {featured && <div className="glow-cyan pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full transition-transform duration-700 group-hover:scale-125" />}
      {/* corner accent that draws in on hover */}
      <span className="pointer-events-none absolute top-0 right-0 h-px w-0 bg-cyan-400 transition-all duration-500 group-hover:w-24" />
      <span className="pointer-events-none absolute top-0 right-0 h-0 w-px bg-cyan-400 transition-all duration-500 group-hover:h-24" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span className={`grid size-11 place-items-center rounded-2xl transition duration-500 group-hover:rotate-[-10deg] group-hover:scale-110 ${featured ? 'bg-cyan-400 text-ink' : 'bg-canvas text-ink ring-1 ring-line group-hover:bg-ink group-hover:text-cyan-300 group-hover:ring-ink'}`}>
            <Icon className="size-5" />
          </span>
          {featured && (
            <div className="flex h-12 items-end gap-1.5" aria-hidden>
              {[30, 46, 40, 62, 55, 78, 100].map((h, k) => (
                <span key={k} className={`w-2.5 origin-bottom rounded-sm transition-transform duration-500 group-hover:scale-y-110 ${k === 6 ? 'bg-cyan-400' : 'bg-white/15'}`} style={{ height: `${h}%`, transitionDelay: `${k * 40}ms` }} />
              ))}
            </div>
          )}
        </div>
        <p className={`font-wide mt-auto pt-10 font-black tracking-tight ${featured ? 'text-6xl text-white sm:text-7xl' : 'text-4xl sm:text-5xl'}`}>
          <span ref={ref}>{value.toLocaleString('en-IN')}</span>
          <span className={`transition-colors duration-500 ${featured ? 'text-cyan-300' : 'text-cyan-600 group-hover:text-cyan-500'}`}>{s.suffix}</span>
        </p>
        <p className={`mt-2 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase ${featured ? 'text-white/60' : 'text-ink/55'}`}>{s.label}</p>
        <p className={`mt-1 text-sm ${featured ? 'text-white/55' : 'text-muted'}`}>{s.note}</p>
      </div>
    </div>
  )
}

export function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <SectionHeading
        eyebrow="Apex in numbers"
        title="Built for people"
        accent="who show up."
        text="Premium equipment, real coaching and a community that pushes you — right here in Dhubulia."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr] lg:grid-rows-2">
        {STATS.map((_, i) => (
          <StatCard key={i} i={i} />
        ))}
        <div className="reveal group card hidden flex-col justify-between gap-6 overflow-hidden p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift sm:flex" style={{ '--reveal-delay': '360ms' } as React.CSSProperties}>
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-ink/55 uppercase">Our promise</p>
          <p className="font-wide text-2xl leading-tight font-extrabold uppercase">
            Coached form.
            <br />
            <span className="text-apex">Measured progress.</span>
          </p>
          <span className="h-1 w-10 rounded-full bg-cyan-400 transition-all duration-500 group-hover:w-full" />
        </div>
      </div>
    </section>
  )
}
