import { Bell, CalendarClock, CalendarX2, CreditCard, Globe, Inbox, LayoutDashboard, Layers, LogOut, Menu, Settings, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initials } from '../../lib/format'
import { useScrollLock } from '../../lib/hooks'
import { Logo } from '../ui/Logo'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/memberships', label: 'Memberships', icon: CreditCard },
  { to: '/admin/expiring', label: 'Expiring Soon', icon: CalendarClock },
  { to: '/admin/expired', label: 'Expired Members', icon: CalendarX2 },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/plans', label: 'Membership Plans', icon: Layers },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <Logo tone="light" to="/admin" />
        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-cyan-300">ADMIN</span>
      </div>
      <nav className="mt-8 grid gap-0.5" aria-label="Admin">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200 ${isActive ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-400 transition-opacity ${isActive ? 'opacity-100 shadow-[0_0_10px_rgb(34_211_238/0.9)]' : 'opacity-0'}`} />
                <n.icon className={`size-[18px] ${isActive ? 'text-cyan-300' : ''}`} />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto grid gap-1 pt-6">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 hover:bg-white/[0.04] hover:text-white">
          <Globe className="size-[18px]" /> View website
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/10">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400 text-xs font-bold text-ink">{initials(user?.name ?? 'A')}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user?.name}</p>
            <p className="truncate text-[11.5px] text-white/45">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              navigate('/')
              await logout()
              toast.info('Signed out')
            }}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminShell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useScrollLock(open)
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] overflow-y-auto bg-ink p-5 lg:block">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative h-full">
          <SideNav />
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-ink px-4 lg:hidden">
        <Logo tone="light" to="/admin" />
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full bg-white/10 text-white" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </header>
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <div className={`absolute inset-y-0 left-0 w-[86%] max-w-[300px] overflow-y-auto bg-ink p-5 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <button onClick={() => setOpen(false)} className="absolute top-5 right-4 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white" aria-label="Close menu">
            <X className="size-4" />
          </button>
          <SideNav onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:ml-[264px] lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1280px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
