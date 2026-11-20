import { BellOff, CheckCheck } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { MemberOutlet } from '../../components/dashboard/MemberShell'
import { CHANNEL_ICON, NotificationRow } from '../../components/dashboard/Widgets'
import { DeliveryBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'

const TYPE_LABEL: Record<string, string> = {
  reminder_first: 'First reminder',
  reminder_second: 'Second reminder',
  expired: 'Expiry notice',
  membership_added: 'Membership added',
  membership_verified: 'Verified',
  custom: 'Message',
}

export default function NotificationsPage() {
  usePageTitle('Notifications')
  const { setUnread } = useOutletContext<MemberOutlet>()
  const { data, error, loading, reload, setData } = useLoad(() => api.notifications().then((r) => r.data), [])

  if (error) return <ErrorState message={error} onRetry={reload} />
  const unread = data?.items.filter((n) => !n.read).length ?? 0

  async function markAll() {
    await api.markRead({ all: true })
    setData((d) => (d ? { ...d, items: d.items.map((n) => ({ ...n, read: true })) } : d))
    setUnread(0)
  }
  async function open(id: number) {
    if (!data || data.items.find((n) => n.id === id)?.read) return
    await api.markRead({ id })
    setData((d) => (d ? { ...d, items: d.items.map((n) => (n.id === id ? { ...n, read: true } : n)) } : d))
    setUnread(Math.max(0, unread - 1))
  }

  return (
    <div className="grid gap-6">
      <header className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1 className="font-wide mt-3 text-3xl font-black uppercase sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-sm text-muted">Membership reminders arrive 5 and 3 days before expiry — here, by email and on WhatsApp.</p>
        </div>
        {unread > 0 && <Button variant="outline" onClick={markAll} icon={<CheckCheck className="size-4" />}>Mark all as read</Button>}
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card animate-fade-up p-3 sm:p-4">
          {loading && !data ? (
            <div className="grid gap-2 p-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : data?.items.length ? (
            <div className="grid gap-1">{data.items.map((n) => <NotificationRow key={n.id} n={n} onClick={() => open(n.id)} />)}</div>
          ) : (
            <EmptyState icon={<BellOff />} title="Nothing here yet" text="When your membership is close to expiring, reminders will show up here." />
          )}
        </section>

        <section className="card animate-fade-up p-5 [animation-delay:80ms] sm:p-6">
          <h2 className="font-wide text-lg font-extrabold uppercase">Delivery history</h2>
          <p className="mt-1 text-[13px] text-muted">Messages sent to your email and WhatsApp.</p>
          <ul className="mt-4 grid gap-2">
            {data?.deliveries.length ? (
              data.deliveries.map((d, i) => {
                const Icon = CHANNEL_ICON[d.channel]
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-canvas px-3.5 py-3 ring-1 ring-line">
                    <Icon className="size-4 shrink-0 text-cyan-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold capitalize">{d.channel} · {TYPE_LABEL[d.type] ?? d.type}</p>
                      <p className="text-[12px] text-muted">{formatDateTime(d.sentAt ?? d.createdAt)}</p>
                    </div>
                    <DeliveryBadge status={d.status} />
                  </li>
                )
              })
            ) : (
              <li className="py-6 text-center text-sm text-muted">No email or WhatsApp messages yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
