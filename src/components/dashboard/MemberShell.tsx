import { Bell, CreditCard, Globe, LayoutGrid, LogOut, MessageSquare, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import { initials } from '../../lib/format'
import { Logo } from '../ui/Logo'

export interface MemberOutlet {
  unread: number
  setUnread: (n: number) => void
}

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/dashboard/membership', label: 'Membership', icon: CreditCard },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
]

export function MemberShell() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [unread, setUnreadState] = useState(0)
  const setUnread = useCallback((n: number) => setUnreadState(n), [])

  useEffect(() => {
    api.notifications().then((r) => setUnreadState(r.data.items.filter((n) => !n.read).length)).catch(() => {})
  }, [])

  async function signOut() {
    navigate('/')
    await logout()
    toast.info('Signed out', 'See you on the floor.')
  }

  if (!user) return null

  const badge = (label: string) =>
    label === 'Notifications' && unread > 0 ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-cyan-400 px-1.5 text-[11px] font-bold text-ink">{unread}</span>
    ) : null

  return (
    <div className="min-h-screen bg-grid">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-canvas/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/dashboard/notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-white" aria-label="Notifications">
            <Bell className="size-[18px]" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-cyan-400 text-[10px] font-bold text-ink">{unread}</span>}
          </Link>
          <Link to="/dashboard/profile" className="grid size-10 place-items-center rounded-full bg-ink text-xs font-bold text-cyan-300" aria-label="Profile">
            {initials(user.name)}
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 lg:px-6 lg:py-6">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[28px] border border-line bg-white p-5 shadow-card lg:flex">
          <Logo />
          <div className="mt-7 flex items-center gap-3 rounded-2xl bg-canvas p-3 ring-1 ring-line">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-xs font-bold text-cyan-300">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="truncate text-[12px] text-muted">{user.email}</p>
            </div>
          </div>
          <nav className="mt-6 grid gap-1" aria-label="Dashboard">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14.5px] font-semibold transition-all duration-200 ${isActive ? 'bg-ink text-white shadow-[0_8px_20px_-12px_rgb(10_14_17/0.8)] [&_svg]:text-cyan-300' : 'text-ink/65 hover:bg-canvas hover:text-ink'}`
                }
              >
                <n.icon className="size-[18px]" />
                {n.label}
                {badge(n.label)}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto grid gap-1 border-t border-line pt-4">
            <Link to="/contact" className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-ink/65 hover:bg-canvas hover:text-ink">
              <MessageSquare className="size-[18px]" /> Contact the gym
            </Link>
            <Link to="/" className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-ink/65 hover:bg-canvas hover:text-ink">
              <Globe className="size-[18px]" /> Back to website
            </Link>
            <button onClick={signOut} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut className="size-[18px]" /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-0 lg:pt-0 lg:pb-6">
          <Outlet context={{ unread, setUnread } satisfies MemberOutlet} />
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden" aria-label="Dashboard">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `relative flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition ${isActive ? 'text-ink' : 'text-ink/45'}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-14 place-items-center rounded-full transition-all duration-200 ${isActive ? 'bg-ink text-cyan-300' : ''}`}>
                    <n.icon className="size-[18px]" />
                  </span>
                  {n.label}
                  {n.label === 'Notifications' && unread > 0 && <span className="absolute top-0.5 right-3 size-2 rounded-full bg-cyan-400 ring-2 ring-white" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
