import { BadgeCheck, Check, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { inr } from '../../lib/format'
import { useLoad } from '../../lib/hooks'
import { DEFAULT_PLANS } from '../../config/site'
import type { Plan } from '../../types'
import { Button } from '../ui/Button'
import { SectionHeading, Skeleton } from '../ui/Misc'

function PlanCard({ plan, i }: { plan: Plan; i: number }) {
  const f = plan.isFeatured
  const months = Math.round(plan.durationDays / 30)
  return (
    <div
      style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
      className={`reveal group relative flex flex-col rounded-[28px] p-7 transition-all duration-500 hover:-translate-y-2 ${
        f
          ? 'card-dark border-cyan-400/40 bg-ink shadow-lift hover:border-cyan-400 hover:shadow-[0_30px_60px_-30px_rgb(34_211_238/0.75)] lg:-my-4 lg:py-11'
          : 'card hover:shadow-[0_30px_60px_-30px_rgb(6_182_212/0.55)]'
      }`}
    >
      {f && (
        <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-1 font-mono text-[10.5px] font-bold tracking-wider text-ink uppercase">
          <BadgeCheck className="size-3.5" /> Most popular
        </span>
      )}
      <div className="relative flex flex-1 flex-col">
        <span className={`font-mono text-[11px] font-semibold tracking-[0.16em] uppercase ${f ? 'text-cyan-300' : 'text-cyan-700'}`}>{plan.durationDays} days</span>
        <h3 className={`font-wide mt-1.5 text-[22px] leading-tight font-extrabold uppercase transition-colors duration-500 xl:text-2xl ${f ? 'group-hover:text-cyan-300' : 'group-hover:text-cyan-700'}`}>{plan.name}</h3>
        {plan.tagline && <p className={`mt-2 text-sm ${f ? 'text-white/60' : 'text-muted'}`}>{plan.tagline}</p>}

        <div className={`mt-6 border-y py-5 ${f ? 'border-white/10' : 'border-line'}`}>
          {plan.price !== null ? (
            <>
              <p className="font-wide text-4xl font-black tracking-tight">{inr(plan.price)}</p>
              <p className={`mt-1 text-[13px] ${f ? 'text-white/55' : 'text-muted'}`}>
                {months > 1 ? `≈ ${inr(Math.round(plan.price / months))} / month · ` : ''}paid at the front desk
              </p>
            </>
          ) : (
            <p className="font-wide text-2xl font-extrabold">Ask at the desk</p>
          )}
        </div>

        <ul className="mt-6 space-y-3">
          {plan.features.map((ft) => (
            <li key={ft} className="flex gap-3 text-[14.5px]">
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${f ? 'bg-cyan-400 text-ink' : 'bg-cyan-50 text-cyan-700'}`}>
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className={f ? 'text-white/85' : 'text-ink/80'}>{ft}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <Button
            to="/contact?topic=membership"
            variant={f ? 'primary' : 'dark'}
            block
            arrow
            className={f ? '' : 'group-hover:bg-cyan-400 group-hover:text-ink hover:bg-cyan-300!'}
          >
            Become a member
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PlansSection({ eyebrow = 'Membership plans' }: { eyebrow?: string }) {
  const { data, loading, error } = useLoad(() => api.plans().then((r) => r.data.plans), [])
  // If the server can't be reached, still show the plans (from src/config/site.ts).
  const plans = data ?? (error ? DEFAULT_PLANS : null)
  return (
    <section id="plans" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <SectionHeading
        eyebrow={eyebrow}
        title="Choose your"
        accent="commitment."
        text="Every plan includes the full gym floor, expert coaching and online membership tracking. Join in person at Apex Fitness."
        align="center"
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
        {loading && !plans
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[30rem] rounded-[28px]" />)
          : plans?.map((p, i) => <PlanCard key={p.id} plan={p} i={i} />)}
      </div>
      <div className="reveal mt-10 flex flex-col items-start gap-4 rounded-3xl border border-dashed border-ink/20 bg-white/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-cyan-300">
            <Store className="size-5" />
          </span>
          <div>
            <p className="font-bold">Memberships are purchased in person at Apex Fitness.</p>
            <p className="mt-0.5 text-sm text-muted">No online payments. Already joined? Link your membership to track days left and get renewal reminders.</p>
          </div>
        </div>
        <Link to="/register" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-line transition hover:ring-ink/25">
          Link my membership →
        </Link>
      </div>
    </section>
  )
}
