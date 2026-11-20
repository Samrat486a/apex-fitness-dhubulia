import { AlertCircle, BadgeCheck, CalendarClock, CalendarX2, Inbox, Mail, MessageCircle, PlayCircle, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminHeader, Avatar, KpiCard } from '../../components/admin/Parts'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ErrorState, Skeleton } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { formatDate, formatDateTime, timeAgo, TOPIC_LABEL } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'

export default function AdminOverview() {
  usePageTitle('Admin overview')
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api.adminOverview().then((r) => r.data), [])
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

  const header = (
    <AdminHeader
      eyebrow="Apex Fitness · Admin"
      title="Overview"
      text={data?.remindersLastRun ? `Reminder job last ran ${formatDateTime(data.remindersLastRun)}.` : 'Membership health at a glance.'}
      actions={<Button variant="primary" onClick={runNow} loading={running} icon={<PlayCircle className="size-4" />}>Run reminders now</Button>}
    />
  )

  if (error) return <>{header}<ErrorState message={error} onRetry={reload} /></>
  if (loading && !data) {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      </>
    )
  }
  if (!data) return null
  const s = data.stats
  const maxPlan = Math.max(1, ...data.byPlan.map((b) => b.count))

  return (
    <>
      {header}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard tone="dark" label="Total members" value={s.totalMembers} icon={<Users />} sub={`${s.newThisMonth} joined this month`} />
        <KpiCard label="Active memberships" value={s.active} icon={<BadgeCheck />} sub="Incl. starting soon" delay={50} />
        <KpiCard tone="cyan" label="Expiring soon" value={s.expiring} icon={<CalendarClock />} sub="Within reminder window" delay={100} />
        <KpiCard tone="red" label="Expired" value={s.expired} icon={<CalendarX2 />} sub="Needs renewal" delay={150} />
        <KpiCard tone="amber" label="Pending verification" value={s.pendingVerification} icon={<AlertCircle />} sub="Check against receipts" delay={200} />
        <KpiCard label="No membership" value={s.noMembership} icon={<UserPlus />} sub="Registered, not linked" delay={250} />
        <KpiCard label="Emails sent · 30d" value={s.emailSent30d} icon={<Mail />} delay={300} />
        <KpiCard label="WhatsApp sent · 30d" value={s.whatsappSent30d} icon={<MessageCircle />} sub={s.failedNotifications ? `${s.failedNotifications} failed — review` : 'No failures'} delay={350} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-wide text-lg font-extrabold uppercase">Expiring soon</h2>
              <p className="text-[13px] text-muted">Members inside the reminder window</p>
            </div>
            <Link to="/admin/expiring" className="text-[13px] font-bold text-cyan-700 hover:text-cyan-600">View all →</Link>
          </div>
          <ul className="divide-y divide-line">
            {data.expiringSoon.length ? (
              data.expiringSoon.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-canvas/70 sm:px-6">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{c.name}</p>
                      <p className="truncate text-[12.5px] text-muted">{c.membership?.planName} · expires {formatDate(c.membership?.expiryDate)}</p>
                    </div>
                    <span className={`font-wide rounded-xl px-2.5 py-1.5 text-sm font-black ${c.membership!.daysRemaining <= 3 ? 'bg-ink text-cyan-300' : 'bg-cyan-50 text-cyan-800'}`}>
                      {c.membership!.daysRemaining}d
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-6 py-10 text-center text-sm text-muted">No memberships are about to expire.</li>
            )}
          </ul>
        </section>

        <section className="card animate-fade-up p-5 [animation-delay:80ms] sm:p-6">
          <h2 className="font-wide text-lg font-extrabold uppercase">Members by plan</h2>
          <p className="text-[13px] text-muted">Current, non-expired memberships</p>
          <div className="mt-6 grid gap-4">
            {data.byPlan.length ? (
              data.byPlan.map((b) => (
                <div key={b.plan}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{b.plan}</span>
                    <span className="font-mono font-semibold">{b.count}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
                    <div className="h-full origin-left animate-bar rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400" style={{ width: `${(b.count / maxPlan) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted">No active memberships yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-wide text-lg font-extrabold uppercase">New sign-ups</h2>
            <Link to="/admin/customers" className="text-[13px] font-bold text-cyan-700 hover:text-cyan-600">All customers →</Link>
          </div>
          <ul className="divide-y divide-line">
            {data.recentSignups.map((c) => (
              <li key={c.id}>
                <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-canvas/70 sm:px-6">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="truncate text-[12.5px] text-muted">Joined {timeAgo(c.createdAt)}</p>
                  </div>
                  <StatusBadge status={c.membership?.status ?? 'none'} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card animate-fade-up overflow-hidden [animation-delay:80ms]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-wide text-lg font-extrabold uppercase">Latest inquiries</h2>
            <Link to="/admin/inquiries" className="text-[13px] font-bold text-cyan-700 hover:text-cyan-600">Inbox →</Link>
          </div>
          <ul className="divide-y divide-line">
            {data.recentMessages.length ? (
              data.recentMessages.map((m) => (
                <li key={m.id} className="flex gap-3.5 px-5 py-3.5 sm:px-6">
                  <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${m.status === 'new' ? 'bg-cyan-400 text-ink' : 'bg-canvas text-ink/50 ring-1 ring-line'}`}>
                    <Inbox className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-bold">{m.name}</span>
                      <span className="shrink-0 text-[11.5px] text-muted">{timeAgo(m.createdAt)}</span>
                    </p>
                    <p className="text-[12px] font-semibold text-cyan-700">{TOPIC_LABEL[m.topic] ?? m.topic}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-ink/65">{m.message}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-10 text-center text-sm text-muted">No inquiries yet.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  )
}
