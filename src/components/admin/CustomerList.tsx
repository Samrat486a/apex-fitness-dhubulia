import { ChevronRight, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Query } from '../../lib/api'
import { formatDate, formatPhone, timeAgo } from '../../lib/format'
import { useDebounced, useLoad } from '../../lib/hooks'
import type { MembershipStatus } from '../../types'
import { StatusBadge, VerificationBadge } from '../ui/Badge'
import { EmptyState, ErrorState, Skeleton } from '../ui/Misc'
import { Avatar, FilterChips, MiniSelect, Pagination, SearchInput } from './Parts'

type StatusFilter = 'all' | MembershipStatus | 'none' | 'pending'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'upcoming', label: 'Starts soon' },
  { value: 'pending', label: 'Needs verification' },
  { value: 'none', label: 'No membership' },
]

/** Searchable, filterable customer table (cards on mobile). `fixedStatus` locks the filter (Expired Members page). */
export function CustomerList({ fixedStatus }: { fixedStatus?: StatusFilter }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>(fixedStatus ?? 'all')
  const [plan, setPlan] = useState('0')
  const [sort, setSort] = useState(fixedStatus === 'expired' ? 'expiry' : 'newest')
  const [page, setPage] = useState(1)
  const search = useDebounced(q)
  const plans = useLoad(() => api.plans().then((r) => r.data.plans), [])

  const query: Query = { q: search, status: fixedStatus ?? status, plan, sort, page, perPage: 12 }
  const { data, error, loading, reload } = useLoad(() => api.adminCustomers(query).then((r) => r.data), [search, status, plan, sort, page, fixedStatus])

  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div className="grid gap-4">
      <div className="flex animate-fade-up flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={q} onChange={(v) => reset(() => setQ(v))} placeholder="Search name, email or phone" />
        <div className="flex gap-2">
          <MiniSelect label="Plan" value={plan} onChange={(v) => reset(() => setPlan(v))}>
            <option value="0">All plans</option>
            {plans.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </MiniSelect>
          <MiniSelect label="Sort" value={sort} onChange={(v) => reset(() => setSort(v))}>
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="expiry">Expiry date</option>
          </MiniSelect>
        </div>
      </div>
      {!fixedStatus && <FilterChips value={status} onChange={(v) => reset(() => setStatus(v))} options={FILTERS} />}

      <section className="card animate-fade-up overflow-hidden">
        {error ? (
          <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>
        ) : loading && !data ? (
          <div className="grid gap-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !data?.items.length ? (
          <EmptyState icon={<Users />} title="No customers found" text="Try a different search or filter." />
        ) : (
          <>
            <div className={`hidden overflow-x-auto md:block ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas/70 text-[12px] tracking-wide text-ink/55 uppercase">
                  <tr>
                    {['Customer', 'Phone', 'Plan', 'Expiry', 'Days left', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((c) => (
                    <tr key={c.id} className="group transition hover:bg-canvas/60">
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                          <Avatar name={c.name} />
                          <span className="min-w-0">
                            <span className="block truncate font-bold group-hover:text-cyan-700">{c.name}</span>
                            <span className="block truncate text-[12.5px] text-muted">{c.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-ink/70">{formatPhone(c.phone)}</td>
                      <td className="px-5 py-3.5">
                        {c.membership ? (
                          <span className="flex flex-col gap-1">
                            <span className="font-semibold">{c.membership.planName}</span>
                            {c.membership.verificationStatus !== 'verified' && <VerificationBadge status={c.membership.verificationStatus} short />}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{c.membership ? formatDate(c.membership.expiryDate) : '—'}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold">{c.membership && c.membership.status !== 'expired' ? c.membership.daysRemaining : '—'}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.membership?.status ?? 'none'} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/admin/customers/${c.id}`} className="inline-grid size-8 place-items-center rounded-full text-ink/40 transition group-hover:bg-ink group-hover:text-cyan-300" aria-label={`Open ${c.name}`}>
                          <ChevronRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {data.items.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/customers/${c.id}`} className="flex items-start gap-3 px-4 py-4">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-bold">{c.name}</p>
                        <StatusBadge status={c.membership?.status ?? 'none'} />
                      </div>
                      <p className="truncate text-[12.5px] text-muted">{c.email}</p>
                      <p className="mt-1.5 text-[12.5px] text-ink/70">
                        {c.membership ? `${c.membership.planName} · expires ${formatDate(c.membership.expiryDate)}` : `Registered ${timeAgo(c.createdAt)}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </>
        )}
      </section>
    </div>
  )
}
