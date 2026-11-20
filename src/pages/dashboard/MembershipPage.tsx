import { History, Plus, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { MembershipHero } from '../../components/dashboard/Widgets'
import { MembershipForm } from '../../components/membership/MembershipForm'
import { StatusBadge, VerificationBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'

export default function MembershipPage() {
  usePageTitle('My membership')
  const { user, setUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const adding = params.get('add') === '1'
  const { data, error, loading, reload } = useLoad(() => api.memberships().then((r) => r.data), [])

  const setAdding = (v: boolean) => setParams(v ? { add: '1' } : {}, { replace: true })

  if (!user) return null
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="grid gap-6">
      <header className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Membership</p>
          <h1 className="font-wide mt-3 text-3xl font-black uppercase sm:text-4xl">{adding ? 'Add a membership' : 'My membership'}</h1>
          {adding && <p className="mt-2 max-w-xl text-sm text-muted">Bought or renewed a membership at the front desk? Add it here — we’ll calculate the expiry date for you.</p>}
        </div>
        <Button variant={adding ? 'outline' : 'dark'} onClick={() => setAdding(!adding)} icon={adding ? <X className="size-4" /> : <Plus className="size-4" />}>
          {adding ? 'Cancel' : 'Add membership / renewal'}
        </Button>
      </header>

      {adding ? (
        <div className="animate-fade-up">
          <MembershipForm
            user={user}
            onSaved={(_m, u) => {
              setUser(u)
              setAdding(false)
              reload()
            }}
          />
        </div>
      ) : loading && !data ? (
        <Skeleton className="h-64 rounded-[32px]" />
      ) : data?.current ? (
        <div className="animate-fade-up">
          <MembershipHero m={data.current} />
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={<History />} title="No membership linked" text="Add the membership you bought at Apex Fitness to start tracking it." action={<Button variant="primary" onClick={() => setAdding(true)} arrow>Add my membership</Button>} />
        </div>
      )}

      {!adding && data && data.history.length > 0 && (
        <section className="card animate-fade-up overflow-hidden [animation-delay:80ms]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-wide text-lg font-extrabold uppercase">History</h2>
            <span className="text-[13px] text-muted">{data.history.length} record{data.history.length === 1 ? '' : 's'}</span>
          </div>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas/70 text-[12px] font-semibold tracking-wide text-ink/55 uppercase">
                <tr>
                  {['Plan', 'Purchased', 'Start', 'Expiry', 'Duration', 'Status', 'Verification'].map((h) => (
                    <th key={h} className="px-6 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.history.map((m) => (
                  <tr key={m.id} className={m.id === data.current?.id ? 'bg-cyan-50/40' : ''}>
                    <td className="px-6 py-4 font-bold">{m.planName}{m.id === data.current?.id && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cyan-300">CURRENT</span>}</td>
                    <td className="px-6 py-4 text-ink/70">{formatDate(m.purchaseDate)}</td>
                    <td className="px-6 py-4 text-ink/70">{formatDate(m.startDate)}</td>
                    <td className="px-6 py-4 font-semibold">{formatDate(m.expiryDate)}</td>
                    <td className="px-6 py-4 text-ink/70">{m.durationDays} days</td>
                    <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                    <td className="px-6 py-4"><VerificationBadge status={m.verificationStatus} short /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="divide-y divide-line md:hidden">
            {data.history.map((m) => (
              <li key={m.id} className="grid gap-3 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{m.planName}</p>
                  <StatusBadge status={m.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <span className="text-muted">Start <b className="block text-ink">{formatDate(m.startDate)}</b></span>
                  <span className="text-muted">Expiry <b className="block text-ink">{formatDate(m.expiryDate)}</b></span>
                </div>
                <VerificationBadge status={m.verificationStatus} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
