import { Check, CreditCard, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterChips, MiniSelect, Pagination, SearchInput, AdminHeader } from '../../components/admin/Parts'
import { StatusBadge, VerificationBadge } from '../../components/ui/Badge'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useDebounced, useLoad, usePageTitle } from '../../lib/hooks'
import type { AdminMembershipRow } from '../../types'

type V = 'all' | 'pending' | 'verified' | 'rejected'

export default function AdminMemberships() {
  usePageTitle('Memberships')
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [verification, setVerification] = useState<V>('all')
  const [page, setPage] = useState(1)
  const search = useDebounced(q)
  const { data, error, loading, reload } = useLoad(
    () => api.adminMemberships({ q: search, status, verification, page, perPage: 15 }).then((r) => r.data),
    [search, status, verification, page],
  )

  async function verify(m: AdminMembershipRow, s: 'verified' | 'rejected') {
    try {
      await api.adminCustomerAction(m.userId, 'verify_membership', { membershipId: m.id, status: s })
      toast.success(s === 'verified' ? `Verified ${m.userName}’s membership` : 'Membership rejected')
      reload()
    } catch (e) {
      toast.error('Couldn’t update', errorMessage(e))
    }
  }

  return (
    <>
      <AdminHeader title="Memberships" text="Every membership record — first-time purchases and renewals. Verify member-submitted memberships against front-desk receipts." />
      <div className="grid gap-4">
        <div className="flex animate-fade-up flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search member or receipt no." />
          <MiniSelect label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1) }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
            <option value="upcoming">Starts soon</option>
          </MiniSelect>
        </div>
        <FilterChips<V>
          value={verification}
          onChange={(v) => { setVerification(v); setPage(1) }}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Awaiting verification' },
            { value: 'verified', label: 'Verified' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <section className="card animate-fade-up overflow-hidden">
          {error ? (
            <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>
          ) : loading && !data ? (
            <div className="grid gap-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !data?.items.length ? (
            <EmptyState icon={<CreditCard />} title="No memberships found" text="Try another filter." />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas/70 text-[12px] tracking-wide text-ink/55 uppercase">
                    <tr>{['Member', 'Plan', 'Start', 'Expiry', 'Status', 'Verification', ''].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.items.map((m) => (
                      <tr key={m.id} className="hover:bg-canvas/60">
                        <td className="px-5 py-3.5">
                          <Link to={`/admin/customers/${m.userId}`} className="font-bold hover:text-cyan-700">{m.userName}</Link>
                          <p className="text-[12.5px] text-muted">{m.receiptNumber ?? m.userEmail}</p>
                        </td>
                        <td className="px-5 py-3.5"><span className="font-semibold">{m.planName}</span><p className="text-[12.5px] text-muted">{m.durationDays} days</p></td>
                        <td className="px-5 py-3.5 whitespace-nowrap">{formatDate(m.startDate)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-semibold">{formatDate(m.expiryDate)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                        <td className="px-5 py-3.5"><VerificationBadge status={m.verificationStatus} short /></td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {m.verificationStatus === 'pending' && (
                            <span className="inline-flex gap-1">
                              <button onClick={() => verify(m, 'verified')} className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100" aria-label="Verify"><Check className="size-4" /></button>
                              <button onClick={() => verify(m, 'rejected')} className="grid size-8 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" aria-label="Reject"><X className="size-4" /></button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {data.items.map((m) => (
                  <li key={m.id} className="grid gap-2 px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/admin/customers/${m.userId}`} className="font-bold">{m.userName}</Link>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-[13px] text-muted">{m.planName} · {formatDate(m.startDate)} → {formatDate(m.expiryDate)}</p>
                    <div className="flex items-center justify-between">
                      <VerificationBadge status={m.verificationStatus} short />
                      {m.verificationStatus === 'pending' && (
                        <span className="flex gap-2">
                          <button onClick={() => verify(m, 'verified')} className="rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700">Verify</button>
                          <button onClick={() => verify(m, 'rejected')} className="rounded-full bg-red-50 px-3 py-1.5 text-[13px] font-semibold text-red-600">Reject</button>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
            </>
          )}
        </section>
      </div>
    </>
  )
}
