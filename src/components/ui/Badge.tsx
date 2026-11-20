import type { DeliveryStatus, MembershipStatus, VerificationStatus } from '../../types'
import { STATUS_LABEL } from '../../lib/membership'

const STATUS_STYLE: Record<MembershipStatus | 'none', string> = {
  active: 'bg-cyan-50 text-cyan-800 ring-cyan-600/20',
  upcoming: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  expiring: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  expired: 'bg-red-50 text-red-700 ring-red-600/20',
  none: 'bg-ink/5 text-ink/60 ring-ink/10',
}
const DOT: Record<MembershipStatus | 'none', string> = {
  active: 'bg-cyan-500',
  upcoming: 'bg-sky-500',
  expiring: 'bg-amber-500',
  expired: 'bg-red-500',
  none: 'bg-ink/30',
}

const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset'

export function StatusBadge({ status }: { status: MembershipStatus | 'none' }) {
  return (
    <span className={`${base} ${STATUS_STYLE[status]}`}>
      <span className={`size-1.5 rounded-full ${DOT[status]} ${status === 'expiring' ? 'animate-pulse' : ''}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

const VERIFY: Record<VerificationStatus, [string, string]> = {
  verified: ['Verified', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  pending: ['Awaiting verification', 'bg-ink/5 text-ink/70 ring-ink/10'],
  rejected: ['Rejected', 'bg-red-50 text-red-700 ring-red-600/20'],
}

export function VerificationBadge({ status, short, dark }: { status: VerificationStatus; short?: boolean; dark?: boolean }) {
  const [label, cls] = VERIFY[status]
  const tone = dark && status === 'pending' ? 'bg-white/10 text-white/80 ring-white/20' : cls
  return <span className={`${base} ${tone}`}>{short && status === 'pending' ? 'Pending' : label}</span>
}

const DELIVERY: Record<DeliveryStatus, [string, string]> = {
  sent: ['Sent', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  pending: ['Pending', 'bg-amber-50 text-amber-800 ring-amber-600/25'],
  failed: ['Failed', 'bg-red-50 text-red-700 ring-red-600/20'],
  skipped: ['Opted out', 'bg-ink/5 text-ink/55 ring-ink/10'],
}

export function DeliveryBadge({ status, title }: { status: DeliveryStatus | null; title?: string }) {
  if (!status) return <span className={`${base} bg-amber-50 text-amber-800 ring-amber-600/25`}>Pending</span>
  const [label, cls] = DELIVERY[status]
  return (
    <span className={`${base} ${cls}`} title={title}>
      {label}
    </span>
  )
}

export function Pill({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' | 'cyan' }) {
  const cls =
    tone === 'dark' ? 'bg-ink text-white ring-ink' : tone === 'cyan' ? 'bg-cyan-400 text-ink ring-cyan-400' : 'bg-white text-ink/75 ring-line'
  return <span className={`${base} ${cls}`}>{children}</span>
}
