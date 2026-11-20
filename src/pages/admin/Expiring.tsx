import { CalendarClock, MessageCircle, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminHeader, Avatar, FilterChips } from '../../components/admin/Parts'
import { DeliveryBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { formatDate, formatPhone } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'
import { daysBetween, todayISO } from '../../lib/membership'
import { waHref } from '../../lib/useGym'
import type { Channel, ExpiringCustomer } from '../../types'

type Group = 'first' | 'second' | 'expired'

function Row({ c, group }: { c: ExpiringCustomer; group: Group }) {
  const m = c.membership!
  const sinceExpiry = daysBetween(m.expiryDate, todayISO())
  return (
    <li className="grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[1.4fr_1fr_1.6fr_auto] lg:items-center">
      <Link to={`/admin/customers/${c.id}`} className="flex min-w-0 items-center gap-3">
        <Avatar name={c.name} />
        <span className="min-w-0">
          <span className="block truncate font-bold hover:text-cyan-700">{c.name}</span>
          <span className="block truncate text-[12.5px] text-muted">{formatPhone(c.phone)}</span>
        </span>
      </Link>
      <div className="text-sm">
        <p className="font-semibold">{m.planName}</p>
        <p className="text-[12.5px] text-muted">{group === 'expired' ? `Expired ${formatDate(m.expiryDate)} · ${sinceExpiry}d ago` : `Expires ${formatDate(m.expiryDate)}`}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {(['email', 'whatsapp', 'dashboard'] as Channel[]).map((ch) => {
          const d = c.delivery[ch]
          return (
            <span key={ch} className="flex items-center gap-1.5 text-[12px] font-semibold text-ink/60">
              <span className="capitalize">{ch === 'whatsapp' ? 'WhatsApp' : ch}</span>
              <DeliveryBadge status={group === 'expired' && !d && sinceExpiry > 7 ? 'skipped' : (d?.status ?? null)} title={d?.error ?? undefined} />
            </span>
          )
        })}
      </div>
      <div className="flex items-center gap-2 lg:justify-end">
        {group !== 'expired' && (
          <span className={`font-wide rounded-xl px-3 py-1.5 text-sm font-black ${group === 'second' ? 'bg-ink text-cyan-300' : 'bg-cyan-50 text-cyan-800'}`}>{m.daysRemaining}d left</span>
        )}
        {c.phone && (
          <a href={waHref(c.phone, `Hi ${c.name.split(' ')[0]}, your Apex Fitness membership ${group === 'expired' ? 'has expired' : `expires in ${m.daysRemaining} days`}. Visit the front desk to renew!`)} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100" aria-label={`WhatsApp ${c.name}`}>
            <MessageCircle className="size-4" />
          </a>
        )}
      </div>
    </li>
  )
}

export default function AdminExpiring() {
  usePageTitle('Expiring soon')
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api.adminExpiring().then((r) => r.data), [])
  const [group, setGroup] = useState<Group>('first')
  const [running, setRunning] = useState(false)

  async function runNow() {
    setRunning(true)
    try {
      const r = await api.adminRunReminders()
      toast.success('Reminder job finished', r.message)
      reload()
    } catch (e) {
      toast.error('Reminder job failed', errorMessage(e))
    } finally {
      setRunning(false)
    }
  }

  const titles: Record<Group, string> = {
    first: `${data?.firstDays ?? 5} days remaining`,
    second: `${data?.secondDays ?? 3} days remaining`,
    expired: 'Expired',
  }
  const hint: Record<Group, string> = {
    first: `Members with ${(data?.secondDays ?? 3) + 1}–${data?.firstDays ?? 5} days left. They receive the first reminder.`,
    second: `Members with 1–${data?.secondDays ?? 3} days left. They receive the second reminder.`,
    expired: 'Current membership has ended. An expiry notice is sent once, within 7 days of expiry.',
  }

  return (
    <>
      <AdminHeader
        title="Expiring soon"
        text="Who needs a renewal nudge, and whether their reminders were delivered. Every reminder is sent once per channel — never duplicated."
        actions={<Button variant="primary" onClick={runNow} loading={running} icon={<PlayCircle className="size-4" />}>Run reminders now</Button>}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Skeleton className="h-80" />
      ) : data ? (
        <div className="grid gap-4">
          <div className="grid animate-fade-up grid-cols-3 gap-3 sm:gap-4">
            {(['first', 'second', 'expired'] as Group[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`rounded-3xl p-4 text-left transition-all duration-300 sm:p-5 ${group === g ? (g === 'expired' ? 'bg-red-600 text-white shadow-lift' : 'bg-ink text-white shadow-lift') : 'card hover:-translate-y-0.5'}`}
              >
                <p className={`text-[12px] font-semibold sm:text-[13px] ${group === g ? 'text-white/65' : 'text-muted'}`}>{titles[g]}</p>
                <p className={`font-wide mt-1 text-3xl font-black sm:text-4xl ${group === g && g !== 'expired' ? 'text-cyan-300' : ''}`}>{data[g].length}</p>
              </button>
            ))}
          </div>
          <FilterChips<Group> value={group} onChange={setGroup} options={(['first', 'second', 'expired'] as Group[]).map((g) => ({ value: g, label: titles[g], count: data[g].length }))} />
          <section className="card animate-fade-up overflow-hidden">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-wide text-lg font-extrabold uppercase">{titles[group]}</h2>
              <p className="text-[13px] text-muted">{hint[group]}</p>
            </div>
            {data[group].length ? (
              <ul className="divide-y divide-line">{data[group].map((c) => <Row key={c.id} c={c} group={group} />)}</ul>
            ) : (
              <EmptyState icon={<CalendarClock />} title="Nobody here" text="No members are in this stage right now." />
            )}
          </section>
        </div>
      ) : null}
    </>
  )
}
