import { ArrowRight, Clock, LayoutDashboard, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV } from '../../config/site'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../lib/format'
import { useScrollLock } from '../../lib/hooks'
import { useGym } from '../../lib/useGym'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'

/** Desktop links with a highlight pill that glides to whichever link is hovered. */
function DesktopNav() {
  const navRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false })

  const moveTo = (el: HTMLElement) => setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true })

  return (
    <nav ref={navRef} onMouseLeave={() => setPill((p) => ({ ...p, visible: false }))} className="relative hidden items-center rounded-full p-1 lg:flex" aria-label="Main">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-ink/[0.06] ring-1 ring-ink/[0.06] transition-all duration-500 ease-[cubic-bezier(.22,.8,.3,1)]"
        style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }}
      />
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          onMouseEnter={(e) => moveTo(e.currentTarget)}
          onFocus={(e) => moveTo(e.currentTarget)}
          className={({ isActive }) =>
            `relative z-10 rounded-full px-4 py-2 text-[14.5px] font-semibold transition-colors duration-300 ${isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'}`
          }
        >
          {({ isActive }) => (
            <>
              {n.label}
              <span className={`absolute inset-x-0 -bottom-0.5 mx-auto h-[3px] rounded-full bg-cyan-400 shadow-[0_0_10px_rgb(34_211_238/0.8)] transition-all duration-300 ${isActive ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const gym = useGym()
  useScrollLock(open)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const dashTo = user?.role === 'admin' ? '/admin' : user?.onboardingStatus === 'pending' ? '/onboarding' : '/dashboard'
  const solid = scrolled || open

  return (
    <>
      <header className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${solid ? 'border-b border-line/80 bg-canvas/90 shadow-[0_8px_30px_-20px_rgb(10_14_17/0.35)] backdrop-blur-xl' : 'border-b border-transparent'}`}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[84px] lg:px-8">
          <Logo />
          <DesktopNav />
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={dashTo} className="group hidden items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pr-4 pl-1.5 text-sm font-semibold shadow-card transition hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-lift sm:inline-flex">
                <span className="grid size-8 place-items-center rounded-full bg-ink text-[11px] font-bold text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-ink">{initials(user.name)}</span>
                {user.role === 'admin' ? 'Admin' : 'My dashboard'}
              </Link>
            ) : (
              <>
                <Link to="/login" className="link-u hidden rounded-sm px-2 py-1 text-[14.5px] font-semibold text-ink/75 hover:text-ink sm:inline-flex">
                  Sign in
                </Link>
                <Button to="/register" size="sm" variant="dark" className="hidden h-10 px-5 sm:inline-flex">
                  Join <span className="text-cyan-300">Apex</span>
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative grid size-11 touch-manipulation place-items-center rounded-full border border-line bg-white text-ink transition active:scale-95 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <Menu className={`absolute size-5 transition-all duration-300 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
              <X className={`absolute size-5 transition-all duration-300 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — rendered OUTSIDE the header: a header with backdrop-filter would trap this fixed panel inside its 72px box. */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto overscroll-contain bg-canvas transition-[opacity,transform,visibility] duration-300 lg:hidden ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}
        aria-hidden={!open}
      >
        <div className="flex min-h-full flex-col px-4 pt-4 pb-8 sm:px-6">
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.map((n, i) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                style={{ transitionDelay: open ? `${60 + i * 40}ms` : '0ms' }}
                className={({ isActive }) =>
                  `font-wide flex items-center justify-between border-b border-line py-4 text-2xl font-extrabold uppercase tracking-tight transition-all duration-300 active:text-cyan-600 ${open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} ${isActive ? 'text-ink' : 'text-ink/55'}`
                }
              >
                {n.label}
                <ArrowRight className="size-5 text-cyan-500" />
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 grid gap-3">
            {user ? (
              <Button to={dashTo} onClick={() => setOpen(false)} variant="dark" size="lg" block icon={<LayoutDashboard className="size-4" />}>
                {user.role === 'admin' ? 'Open admin' : 'My dashboard'}
              </Button>
            ) : (
              <>
                <Button to="/register" onClick={() => setOpen(false)} variant="primary" size="lg" block arrow>
                  Create your account
                </Button>
                <Button to="/login" onClick={() => setOpen(false)} variant="outline" size="lg" block>
                  Sign in
                </Button>
              </>
            )}
          </div>
          <div className="mt-auto pt-10">
            <div className="card flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-ink text-cyan-300">
                <Clock className="size-5" />
              </span>
              <div className="text-sm">
                <p className="font-semibold">Mon–Sat · {gym.hoursWeekdays}</p>
                <p className="text-muted">Sunday · {gym.hoursWeekends}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
