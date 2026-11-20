import { Bell, Mail, MessageCircle, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminHeader, FilterChips, MiniSelect, Pagination, SearchInput } from '../../components/admin/Parts'
import { DeliveryBadge } from '../../components/ui/Badge'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { useDebounced, useLoad, usePageTitle } from '../../lib/hooks'
import type { AppNotification } from '../../types'

type Ch = 'all' | 'email' | 'whatsapp' | 'dashboard'
const ICON = { email: Mail, whatsapp: MessageCircle, dashboard: Bell }
const TYPE: Record<string, string> = {
  reminder_first: '1st reminder',
  reminder_second: '2nd reminder',
  expired: 'Expired notice',
  membership_added: 'Membership added',
  membership_verified: 'Verified',
  custom: 'Message',
}

export default function AdminNotifications() {
  usePageTitle('Notifications')
  const toast = useToast()
  const [channel, setChannel] = useState<Ch>('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [retrying, setRetrying] = useState<number | null>(null)
  const search = useDebounced(q)
  const { data, error, loading, reload } = useLoad(() => api.adminNotifications({ channel, status, q: search, page, perPage: 15 }).then((r) => r.data), [channel, status, search, page])

  const count = (ch: string, st: string) => data?.summary.filter((s) => s.channel === ch && s.status === st).reduce((a, s) => a + s.count, 0) ?? 0

  async function retry(n: AppNotification) {
    setRetrying(n.id)
    try {
      const r = await api.adminRetryNotification(n.id)
      if (r.data.notification.status === 'sent') toast.success(r.message)
      else toast.error('Delivery failed again', r.message)
      reload()
    } catch (e) {
      toast.error('Couldn’t retry', errorMessage(e))
    } finally {
      setRetrying(null)
    }
  }

  return (
    <>
      <AdminHeader title="Notifications" text="Every reminder and message with its delivery status. Failed email/WhatsApp messages retry automatically (up to 3 times) — or retry them here." />
      <div className="mb-5 grid animate-fade-up gap-4 sm:grid-cols-3">
        {(['email', 'whatsapp', 'dashboard'] as const).map((ch) => {
          const Icon = ICON[ch]
          return (
            <div key={ch} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-ink text-cyan-300"><Icon className="size-[18px]" /></span>
                <p className="font-bold capitalize">{ch === 'whatsapp' ? 'WhatsApp' : ch}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['Sent', 'sent', 'text-emerald-700'], ['Failed', 'failed', 'text-red-600'], ['Pending', 'pending', 'text-amber-700']].map(([label, st, cls]) => (
                  <div key={st} className="rounded-xl bg-canvas py-2 ring-1 ring-line">
                    <p className={`font-wide text-xl font-black ${cls}`}>{count(ch, st!)}</p>
                    <p className="text-[11px] font-semibold text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid gap-4">
        <div className="flex animate-fade-up flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips<Ch> value={channel} onChange={(v) => { setChannel(v); setPage(1) }} options={[{ value: 'all', label: 'All channels' }, { value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'dashboard', label: 'Dashboard' }]} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search member or recipient" />
            <MiniSelect label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1) }}>
              <option value="all">Any status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="skipped">Opted out</option>
            </MiniSelect>
          </div>
        </div>
        <section className="card animate-fade-up overflow-hidden">
          {error ? (
            <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>
          ) : loading && !data ? (
            <div className="grid gap-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !data?.items.length ? (
            <EmptyState icon={<Bell />} title="No notifications" text="Nothing matches these filters." />
          ) : (
            <>
              <ul className="divide-y divide-line">
                {data.items.map((n) => {
                  const Icon = ICON[n.channel]
                  return (
                    <li key={n.id} className="grid gap-2 px-5 py-4 sm:px-6 md:grid-cols-[1.3fr_1.6fr_auto] md:items-center md:gap-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-canvas ring-1 ring-line"><Icon className="size-4 text-cyan-700" /></span>
                        <div className="min-w-0">
                          <Link to={`/admin/customers/${n.userId}`} className="block truncate text-sm font-bold hover:text-cyan-700">{n.userName}</Link>
                          <p className="truncate text-[12px] text-muted">{n.recipient ?? 'Dashboard'} · {formatDateTime(n.createdAt)}</p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold"><span className="mr-2 rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10.5px] text-ink/60 uppercase">{TYPE[n.type] ?? n.type}</span>{n.title}</p>
                        {n.error && <p className="mt-0.5 truncate text-[12px] text-red-600" title={n.error}>{n.error}</p>}
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <DeliveryBadge status={n.status} title={n.error ?? undefined} />
                        {(n.status === 'failed' || n.status === 'pending') && n.channel !== 'dashboard' && (
                          <button onClick={() => retry(n)} disabled={retrying === n.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50">
                            <RotateCw className={`size-3.5 ${retrying === n.id ? 'animate-spin' : ''}`} /> Retry
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
              <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
            </>
          )}
        </section>
      </div>
    </>
  )
}
