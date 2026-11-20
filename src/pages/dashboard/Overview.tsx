import { CalendarCheck2, CalendarClock, CalendarRange, Clock, Dumbbell, MapPin, MessageCircle, Pencil, Phone, Plus, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { MemberOutlet } from '../../components/dashboard/MemberShell'
import { MembershipHero, NotificationRow, RenewBanner, StatTile } from '../../components/dashboard/Widgets'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { formatDate, formatPhone, GENDER_LABEL, greeting } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'
import { telHref, waHref } from '../../lib/useGym'

export default function Overview() {
  usePageTitle('Dashboard')
  const { setUser } = useAuth()
  const { setUnread } = useOutletContext<MemberOutlet>()
  const { data, error, loading, reload, setData } = useLoad(() => api.dashboard().then((r) => r.data), [])

  useEffect(() => {
    if (data) {
      setUnread(data.unreadCount)
      setUser(data.user)
    }
  }, [data, setUnread, setUser])

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading && !data) {
    return (
      <div className="grid gap-5">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-64 rounded-[32px]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      </div>
    )
  }
  if (!data) return null
  const { user, membership: m, gym, notifications } = data

  async function markAll() {
    await api.markRead({ all: true })
    setData((d) => (d ? { ...d, unreadCount: 0, notifications: d.notifications.map((n) => ({ ...n, read: true })) } : d))
    setUnread(0)
  }

  async function open(id: number) {
    const n = notifications.find((x) => x.id === id)
    if (!n || n.read) return
    await api.markRead({ id })
    setData((d) => (d ? { ...d, unreadCount: Math.max(0, d.unreadCount - 1), notifications: d.notifications.map((x) => (x.id === id ? { ...x, read: true } : x)) } : d))
    setUnread(Math.max(0, data!.unreadCount - 1))
  }

  return (
    <div className="grid gap-6">
      <header className="flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="font-wide mt-1.5 text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {greeting()}, <span className="text-apex">{user.name.split(' ')[0]}.</span>
          </h1>
        </div>
        <Button to="/dashboard/membership?add=1" variant="dark" icon={<Plus className="size-4" />}>
          {m ? 'Add renewal' : 'Add membership'}
        </Button>
      </header>

      {m ? (
        <>
          <RenewBanner m={m} gym={gym} />
          <div className="animate-fade-up [animation-delay:60ms]">
            <MembershipHero m={m} />
          </div>
          <div className="grid animate-fade-up grid-cols-2 gap-4 [animation-delay:120ms] lg:grid-cols-4">
            <StatTile icon={<Dumbbell />} label="Membership plan" value={m.planName} sub={`${m.durationDays}-day plan`} />
            <StatTile icon={<CalendarCheck2 />} label="Start date" value={formatDate(m.startDate)} sub={`Purchased ${formatDate(m.purchaseDate)}`} />
            <StatTile icon={<CalendarRange />} label="Expiry date" value={formatDate(m.expiryDate)} sub={m.status === 'expired' ? 'Membership ended' : 'Last training day is the day before'} />
            <StatTile accent icon={<CalendarClock />} label="Days remaining" value={String(m.status === 'upcoming' ? m.durationDays : m.daysRemaining)} sub={m.status === 'upcoming' ? `Starts ${formatDate(m.startDate)}` : `${m.daysElapsed} of ${m.durationDays} days used`} />
          </div>
        </>
      ) : (
        <div className="card animate-fade-up">
          <EmptyState
            icon={<CalendarClock />}
            title={user.onboardingStatus === 'not_member' ? 'No membership yet' : 'Link your membership'}
            text={user.onboardingStatus === 'not_member' ? 'Join at the Apex Fitness front desk, then add your membership here to track your days and get reminders.' : 'Bought a membership at the gym? Add it to see your expiry date, days remaining and reminders.'}
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button to="/dashboard/membership?add=1" variant="primary" arrow>Add my membership</Button>
                <Button to="/membership" variant="outline">View plans</Button>
              </div>
            }
          />
        </div>
      )}

      <div className="grid animate-fade-up gap-6 [animation-delay:180ms] xl:grid-cols-[1.35fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-wide text-lg font-extrabold uppercase">Notifications</h2>
              <p className="text-[13px] text-muted">{data.unreadCount ? `${data.unreadCount} unread` : 'You’re all caught up'}</p>
            </div>
            <div className="flex gap-1">
              {data.unreadCount > 0 && <button onClick={markAll} className="rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-cyan-700 hover:bg-cyan-50">Mark all read</button>}
              <Link to="/dashboard/notifications" className="rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-ink/65 hover:bg-canvas">View all</Link>
            </div>
          </div>
          <div className="mt-4 grid gap-1">
            {notifications.length ? notifications.slice(0, 5).map((n) => <NotificationRow key={n.id} n={n} onClick={() => open(n.id)} />) : <p className="py-8 text-center text-sm text-muted">No notifications yet. Membership reminders will appear here.</p>}
          </div>
        </section>

        <div className="grid gap-6">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-wide text-lg font-extrabold uppercase">Profile</h2>
              <Link to="/dashboard/profile" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink/65 hover:bg-canvas"><Pencil className="size-3.5" />Edit</Link>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ['Name', user.name],
                ['Email', user.email],
                ['Phone', formatPhone(user.phone)],
                ['Date of birth', formatDate(user.dateOfBirth)],
                ['Gender', user.gender ? GENDER_LABEL[user.gender] : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="truncate text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {!user.address && (
              <Link to="/dashboard/profile" className="mt-4 flex items-center gap-2 rounded-2xl bg-canvas px-3.5 py-3 text-[13px] font-semibold ring-1 ring-line hover:ring-ink/20">
                <UserRound className="size-4 text-cyan-600" /> Complete your profile
              </Link>
            )}
          </section>
        </div>
      </div>

      <div className="grid animate-fade-up gap-6 [animation-delay:240ms] lg:grid-cols-[1fr_1fr]">
        <section className="card-dark relative overflow-hidden p-6">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="font-wide text-lg font-extrabold uppercase">Gym information</h2>
            <ul className="mt-5 grid gap-3.5 text-sm">
              <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-cyan-300" /><span className="text-white/80">{gym.address}</span></li>
              <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-cyan-300" /><span className="text-white/80">Mon–Sat {gym.hoursWeekdays}<br />Sunday {gym.hoursWeekends}</span></li>
              {gym.phone && <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-cyan-300" /><a href={telHref(gym.phone)} className="text-white/80 hover:text-white">{gym.phone}</a></li>}
            </ul>
            {gym.mapUrl && <a href={gym.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-bold text-cyan-300 hover:text-cyan-200">Get directions →</a>}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-wide text-lg font-extrabold uppercase">Quick actions</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { to: '/dashboard/membership?add=1', icon: Plus, label: 'Update membership' },
              { to: '/dashboard/profile', icon: Pencil, label: 'Edit profile' },
              { to: '/contact', icon: MessageCircle, label: 'Contact Apex' },
              { href: gym.whatsapp ? waHref(gym.whatsapp, 'Hi Apex Fitness!') : '/contact', icon: Phone, label: 'WhatsApp desk' },
            ].map((a) => {
              const inner = (
                <>
                  <span className="grid size-10 place-items-center rounded-xl bg-canvas ring-1 ring-line transition group-hover:bg-cyan-400 group-hover:ring-cyan-400"><a.icon className="size-[18px]" /></span>
                  <span className="text-[13.5px] font-bold">{a.label}</span>
                </>
              )
              const cls = 'group flex flex-col items-start gap-3 rounded-2xl border border-line p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-card'
              return a.to ? (
                <Link key={a.label} to={a.to} className={cls}>{inner}</Link>
              ) : (
                <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
