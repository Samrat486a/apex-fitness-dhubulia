import { Check, Inbox, Mail, Phone, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { AdminHeader, Pagination } from '../../components/admin/Parts'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { formatDateTime, formatPhone, TOPIC_LABEL } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'
import { telHref } from '../../lib/useGym'

export default function AdminInquiries() {
  usePageTitle('Inquiries')
  const toast = useToast()
  const [page, setPage] = useState(1)
  const { data, error, loading, reload, setData } = useLoad(() => api.adminMessages({ page, perPage: 12 }).then((r) => r.data), [page])

  async function mark(id: number, status: 'new' | 'handled') {
    try {
      await api.adminUpdateMessage(id, status)
      setData((d) => (d ? { ...d, items: d.items.map((m) => (m.id === id ? { ...m, status } : m)) } : d))
    } catch (e) {
      toast.error('Couldn’t update', errorMessage(e))
    }
  }

  return (
    <>
      <AdminHeader title="Inquiries" text="Messages from the website contact form." />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Skeleton className="h-80" />
      ) : !data?.items.length ? (
        <div className="card"><EmptyState icon={<Inbox />} title="Inbox zero" text="No messages yet." /></div>
      ) : (
        <section className="card animate-fade-up overflow-hidden">
          <ul className="divide-y divide-line">
            {data.items.map((m) => (
              <li key={m.id} className={`grid gap-3 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_2fr_auto] lg:gap-6 ${m.status === 'new' ? 'bg-cyan-50/40' : ''}`}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-bold">{m.status === 'new' && <span className="size-2 rounded-full bg-cyan-500" />}{m.name}</p>
                  <a href={`mailto:${m.email}`} className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-muted hover:text-ink"><Mail className="size-3.5" />{m.email}</a>
                  {m.phone && <a href={telHref(m.phone)} className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"><Phone className="size-3.5" />{formatPhone(m.phone)}</a>}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-cyan-700">{TOPIC_LABEL[m.topic] ?? m.topic} · {formatDateTime(m.createdAt)}</p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink/80">{m.message}</p>
                </div>
                <div>
                  {m.status === 'new' ? (
                    <button onClick={() => mark(m.id, 'handled')} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-ink-3"><Check className="size-4 text-cyan-300" />Mark handled</button>
                  ) : (
                    <button onClick={() => mark(m.id, 'new')} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-muted ring-1 ring-line hover:text-ink"><RotateCcw className="size-4" />Reopen</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
        </section>
      )}
    </>
  )
}
