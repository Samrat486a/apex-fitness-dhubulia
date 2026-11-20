import { AlertTriangle, BellRing, CalendarCheck2, CalendarX2, CheckCheck, CircleDot, Hourglass, Mail, MessageCircle, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDate, timeAgo } from '../../lib/format'
import { telHref, waHref } from '../../lib/useGym'
import type { AppNotification, GymInfo, Membership } from '../../types'
import { StatusBadge, VerificationBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ProgressRing } from '../ui/ProgressRing'

/** The big dark membership card at the top of the member dashboard. */
export function MembershipHero({ m }: { m: Membership }) {
  const pct = Math.round(m.progress * 100)
  const left = m.status === 'upcoming' ? m.durationDays : m.daysRemaining
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-ink p-6 text-white shadow-lift sm:p-8">
      <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-70" />
      <div className={`pointer-events-none absolute -top-24 -right-24 size-80 rounded-full ${m.status === 'expired' ? 'glow-red' : m.status === 'expiring' ? 'glow-amber' : 'glow-cyan'}`} />
      <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <div className="mx-auto">
          <ProgressRing value={m.status === 'expired' ? 1 : m.progress} size={176} stroke={13}>
            <span className="font-wide text-5xl leading-none font-black">{left}</span>
            <span className="mt-1 text-[12px] text-white/55">{m.status === 'upcoming' ? 'days · starts soon' : m.status === 'expired' ? 'days left' : left === 1 ? 'day left' : 'days left'}</span>
          </ProgressRing>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={m.status} />
            <VerificationBadge status={m.verificationStatus} dark />
          </div>
          <p className="mt-3 font-mono text-[11px] tracking-[0.18em] text-white/45 uppercase">Current plan</p>
          <h2 className="font-wide text-4xl font-black tracking-tight uppercase sm:text-5xl">{m.planName}</h2>

          <div className="mt-6">
            <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={`absolute inset-y-0 left-0 origin-left animate-bar rounded-full ${m.status === 'expired' ? 'bg-red-400' : m.status === 'expiring' ? 'bg-gradient-to-r from-cyan-400 to-amber-400' : 'bg-gradient-to-r from-cyan-500 to-cyan-300'}`}
                style={{ width: `${m.status === 'expired' ? 100 : Math.max(3, pct)}%` }}
              />
            </div>
            <div className="mt-2.5 flex justify-between text-[12px] text-white/55">
              <span>Started {formatDate(m.startDate)}</span>
              <span>{m.status === 'expired' ? 'Expired' : `${pct}% used`}</span>
              <span>Expires {formatDate(m.expiryDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Renewal banner for expiring / expired memberships. */
export function RenewBanner({ m, gym }: { m: Membership; gym: GymInfo }) {
  if (m.status !== 'expiring' && m.status !== 'expired') return null
  const expired = m.status === 'expired'
  const msg = expired
    ? `Your Apex Fitness membership expired on ${formatDate(m.expiryDate)}.`
    : `Your Apex Fitness membership expires in ${m.daysRemaining} ${m.daysRemaining === 1 ? 'day' : 'days'}.`
  return (
    <div className={`flex animate-fade-up flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between ${expired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-3.5">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${expired ? 'bg-red-600 text-white' : 'bg-amber-400 text-ink'}`}>
          {expired ? <CalendarX2 className="size-5" /> : <AlertTriangle className="size-5" />}
        </span>
        <div>
          <p className="font-bold">{msg}</p>
          <p className="mt-0.5 text-sm text-ink/65">Renew at the front desk to keep training — then add the renewal here.</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {gym.whatsapp && (
          <Button href={waHref(gym.whatsapp, 'Hi Apex Fitness, I would like to renew my membership.')} target="_blank" variant="dark" size="sm" icon={<MessageCircle className="size-4" />}>
            WhatsApp
          </Button>
        )}
        {gym.phone && (
          <Button href={telHref(gym.phone)} variant="outline" size="sm">
            Call desk
          </Button>
        )}
      </div>
    </div>
  )
}

export function StatTile({ icon, label, value, sub, accent }: { icon: ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 transition-all duration-500 hover:-translate-y-0.5 ${accent ? 'bg-cyan-400 text-ink' : 'card hover:shadow-lift'}`}>
      <span className={`grid size-10 place-items-center rounded-xl [&>svg]:size-[18px] ${accent ? 'bg-ink text-cyan-300' : 'bg-canvas text-ink ring-1 ring-line'}`}>{icon}</span>
      <p className={`mt-4 font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase ${accent ? 'text-ink/65' : 'text-ink/50'}`}>{label}</p>
      <p className="font-wide mt-1 text-xl font-black tracking-tight sm:text-2xl">{value}</p>
      {sub && <p className={`mt-0.5 text-[12.5px] ${accent ? 'text-ink/70' : 'text-muted'}`}>{sub}</p>}
    </div>
  )
}

const N_ICON: Record<string, typeof BellRing> = {
  reminder_first: Hourglass,
  reminder_second: BellRing,
  expired: CalendarX2,
  membership_added: CalendarCheck2,
  membership_verified: CheckCheck,
  custom: Sparkles,
}

export function NotificationRow({ n, onClick }: { n: AppNotification; onClick?: () => void }) {
  const Icon = N_ICON[n.type] ?? CircleDot
  const urgent = n.type === 'reminder_second' || n.type === 'expired'
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-start gap-3.5 rounded-2xl p-3.5 text-left transition-colors duration-300 ${n.read ? 'hover:bg-canvas' : 'bg-cyan-50/70 hover:bg-cyan-50'}`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${urgent ? 'bg-ink text-cyan-300' : 'bg-white text-ink ring-1 ring-line'}`}>
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-bold">{n.title}</span>
          <span className="shrink-0 text-[11.5px] text-muted">{timeAgo(n.createdAt)}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-ink/65">{n.message}</span>
      </span>
      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan-500" aria-label="Unread" />}
    </button>
  )
}

export const CHANNEL_ICON = { email: Mail, whatsapp: MessageCircle, dashboard: BellRing }
