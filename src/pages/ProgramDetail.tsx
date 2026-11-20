import { ArrowLeft, BadgeCheck, CalendarDays, Check, ChevronRight, Flame, Gauge, HeartPulse, MapPin, MessageCircle, Moon, Target, Timer, TrendingUp, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IntensityBars, ProgramCard } from '../components/home/Programs'
import { Button } from '../components/ui/Button'
import { PROGRAMS, srcSet } from '../config/site'
import { usePageTitle, useReveal } from '../lib/hooks'
import { NotFoundPage } from './PublicPages'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const OUTCOME_ICONS = [Target, TrendingUp, HeartPulse, Trophy]
const INTENSITY_LABEL = ['', 'Gentle', 'Moderate', 'Challenging', 'Hard', 'All-out']
const SEGMENT = ['bg-cyan-200', 'bg-cyan-300', 'bg-cyan-400', 'bg-cyan-500', 'bg-cyan-600']

export default function ProgramDetail() {
  const { slug } = useParams()
  const p = PROGRAMS.find((x) => x.slug === slug)
  usePageTitle(p?.title ?? 'Program')
  const ref = useReveal<HTMLDivElement>()
  const [activeStep, setActiveStep] = useState<number | null>(null)

  if (!p) return <NotFoundPage />

  const total = p.session.reduce((a, s) => a + s.mins, 0)
  const trainingDays = p.week.filter(Boolean).length
  const related = [...PROGRAMS.filter((x) => x.slug !== p.slug && x.category === p.category), ...PROGRAMS.filter((x) => x.slug !== p.slug && x.category !== p.category)].slice(0, 3)
  const enquire = `/contact?topic=${p.category === 'Coaching' ? 'personal_training' : 'visit'}`

  return (
    <div ref={ref}>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="flex animate-fade-up items-center gap-1.5 text-[13px] font-medium text-muted" aria-label="Breadcrumb">
          <Link to="/" className="link-u hover:text-ink">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link to="/programs" className="link-u hover:text-ink">Programs</Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-ink">{p.title}</span>
        </nav>

        <div className="group relative mt-5 animate-fade-up overflow-hidden rounded-[32px] bg-ink text-white shadow-lift [animation-delay:60ms] sm:rounded-[40px]">
          <div className="relative h-64 sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%]">
            <img
              src={p.image}
              srcSet={srcSet(p.image)}
              sizes="(min-width: 1024px) 62vw, 100vw"
              alt={p.title}
              fetchPriority="high"
              className="size-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/40 lg:to-transparent" />
          </div>
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative px-6 pb-8 sm:px-10 sm:pb-10 lg:max-w-[56%] lg:py-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-400 px-3 py-1 font-mono text-[10.5px] font-bold tracking-wider text-ink uppercase">{p.category}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold ring-1 ring-white/15">Included with membership</span>
            </div>
            <h1 className="font-wide mt-5 leading-[0.95] font-black tracking-[-0.03em] break-words uppercase" style={{ fontSize: 'clamp(1.75rem, 8.4vw, 3.75rem)' }}>{p.title}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">{p.tagline}</p>
            <div className="mt-7 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Gauge, label: 'Level', value: p.level },
                { icon: CalendarDays, label: 'Frequency', value: p.sessions },
                { icon: Timer, label: 'Session', value: p.duration },
                { icon: Flame, label: 'Intensity', value: INTENSITY_LABEL[p.intensity] },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 transition duration-500 hover:-translate-y-0.5 hover:bg-white/10 hover:ring-cyan-300/40">
                  <c.icon className="size-4 text-cyan-300" />
                  <p className="mt-2 text-[11px] text-white/50">{c.label}</p>
                  <p className="text-sm font-bold">{c.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/contact?topic=visit" variant="primary" size="lg" arrow>Book a free trial</Button>
              <Button to={enquire} variant="light" size="lg" icon={<MessageCircle className="size-4" />}>Ask about this program</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Overview + at a glance ── */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <div className="reveal">
          <p className="eyebrow">The program</p>
          <h2 className="font-wide mt-4 text-3xl leading-[1.02] font-black uppercase sm:text-4xl">
            What is <span className="text-apex">{p.title}?</span>
          </h2>
          <div className="mt-6 space-y-4 text-[16.5px] leading-relaxed text-ink/75">
            {p.overview.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
          <h3 className="font-wide mt-10 text-lg font-extrabold uppercase">Who it’s for</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {p.forWho.map((w) => (
              <li key={w} className="group card flex items-start gap-3 p-4 text-[14.5px] transition duration-500 hover:-translate-y-0.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700 transition duration-500 group-hover:bg-cyan-400 group-hover:text-ink">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        <aside className="reveal card-dark h-fit overflow-hidden p-6 sm:p-7 lg:sticky lg:top-24" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">At a glance</p>
            <dl className="mt-5 grid gap-3 text-sm">
              {[
                ['Category', p.category],
                ['Level', p.level],
                ['Training days', p.sessions],
                ['Session length', p.duration],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-white/10 pb-3">
                  <dt className="text-white/55">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <dt className="text-white/55">Intensity</dt>
                <dd className="flex items-center gap-2 font-semibold">
                  <IntensityBars value={p.intensity} dark /> {INTENSITY_LABEL[p.intensity]}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3 rounded-2xl bg-cyan-400 p-4 text-ink">
              <BadgeCheck className="mt-0.5 size-5 shrink-0" />
              <p className="text-[13.5px] leading-snug font-semibold">Included with every Apex membership — just tell the front desk you want to start.</p>
            </div>
            <Button to="/membership" variant="light" block className="mt-4">View membership plans</Button>
          </div>
        </aside>
      </section>

      {/* ── Outcomes ── */}
      <section className="border-y border-line bg-canvas-2/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="reveal">
            <p className="eyebrow">Results</p>
            <h2 className="font-wide mt-4 text-3xl leading-[1.02] font-black uppercase sm:text-4xl">
              What you’ll <span className="text-apex">achieve.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {p.outcomes.map((o, i) => {
              const Icon = OUTCOME_ICONS[i % OUTCOME_ICONS.length]!
              return (
                <div key={o.title} style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties} className="reveal group card overflow-hidden p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-lift">
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-cyan-500 to-cyan-300 transition-transform duration-500 group-hover:scale-x-100" />
                  <div className="flex items-start justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-ink text-cyan-300 transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-cyan-400 group-hover:text-ink">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-wide text-outline text-4xl leading-none font-black text-ink/15 transition-colors duration-500 group-hover:text-cyan-500">0{i + 1}</span>
                  </div>
                  <h3 className="font-wide mt-6 text-lg font-extrabold uppercase">{o.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{o.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Inside a session ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="reveal flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Session breakdown</p>
            <h2 className="font-wide mt-4 text-3xl leading-[1.02] font-black uppercase sm:text-4xl">
              Inside a <span className="text-apex">session.</span>
            </h2>
          </div>
          <p className="font-mono text-sm font-semibold text-ink/60">{total} minutes total</p>
        </div>

        {/* proportional bar */}
        <div className="reveal mt-8 flex h-4 overflow-hidden rounded-full bg-ink/5 ring-1 ring-line" aria-hidden>
          {p.session.map((s, i) => (
            <span
              key={s.title}
              className={`h-full transition-all duration-500 ${SEGMENT[i % SEGMENT.length]} ${activeStep === null || activeStep === i ? 'opacity-100' : 'opacity-30'}`}
              style={{ width: `${(s.mins / total) * 100}%` }}
            />
          ))}
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {p.session.map((s, i) => (
            <li
              key={s.title}
              onMouseEnter={() => setActiveStep(i)}
              onMouseLeave={() => setActiveStep(null)}
              style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
              className="reveal group card p-5 transition-all duration-500 hover:-translate-y-1.5 hover:bg-ink hover:text-white hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className={`size-3 rounded-full ${SEGMENT[i % SEGMENT.length]}`} />
                <span className="font-mono text-[12px] font-semibold text-ink/50 transition-colors group-hover:text-cyan-300">{s.mins} min</span>
              </div>
              <p className="font-wide mt-4 text-base font-extrabold uppercase">{s.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted transition-colors group-hover:text-white/65">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Week ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="reveal flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Sample week</p>
            <h2 className="font-wide mt-4 text-3xl leading-[1.02] font-black uppercase sm:text-4xl">
              Your training <span className="text-apex">week.</span>
            </h2>
          </div>
          <p className="text-sm text-muted">{trainingDays} active days · times flexible within opening hours</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {p.week.map((focus, i) => (
            <div
              key={DAYS[i]}
              style={{ '--reveal-delay': `${i * 50}ms` } as React.CSSProperties}
              className={`reveal group flex min-h-32 flex-col justify-between rounded-3xl p-4 transition-all duration-500 hover:-translate-y-1.5 ${
                focus ? 'card-dark bg-ink hover:shadow-[0_20px_40px_-20px_rgb(6_182_212/0.7)]' : 'border border-dashed border-ink/20 bg-white/50 text-ink/60 hover:border-cyan-500/60'
              }`}
            >
              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[12px] font-bold tracking-wider uppercase">{DAYS[i]}</span>
                {focus ? <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgb(34_211_238/0.9)]" /> : <Moon className="size-3.5" />}
              </div>
              <p className={`relative mt-6 text-[14px] leading-snug font-bold ${focus ? 'text-white' : ''}`}>{focus ?? 'Rest & recover'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal card-dark relative overflow-hidden px-6 py-10 sm:px-12 sm:py-14">
          <div className="bg-grid-dark pointer-events-none absolute inset-0" />
          <div className="glow-cyan pointer-events-none absolute -right-24 -bottom-32 size-[28rem] rounded-full" />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-cyan-300 uppercase"><MapPin className="size-3.5" />Apex Fitness, Dhubulia</p>
              <h2 className="font-wide mt-3 text-3xl leading-[1] font-black uppercase sm:text-5xl">Start {p.title} this week.</h2>
              <p className="mt-3 max-w-xl text-white/65">Visit the front desk for a free trial and fitness assessment — we’ll get you set up on the right plan.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button to="/contact?topic=visit" variant="primary" size="lg" arrow>Book a free trial</Button>
              <Button to="/membership" variant="light" size="lg">See plans</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="reveal flex items-end justify-between gap-4">
          <h2 className="font-wide text-2xl font-black uppercase sm:text-3xl">More programs</h2>
          <Link to="/programs" className="group inline-flex items-center gap-1.5 text-sm font-bold">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            <span className="link-u">All programs</span>
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r, i) => (
            <div key={r.slug} className="reveal" style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
              <ProgramCard p={r} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
