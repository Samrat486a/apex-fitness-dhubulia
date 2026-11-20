import { ArrowUp, ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { openStatus } from '../../lib/openStatus'
import { telHref, useGym, waHref } from '../../lib/useGym'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'

const COLUMNS = [
  { title: 'Explore', links: [['Home', '/'], ['Programs', '/programs'], ['Membership', '/membership'], ['About', '/about']] },
  { title: 'Members', links: [['Sign in', '/login'], ['Create account', '/register'], ['My dashboard', '/dashboard'], ['Link membership', '/dashboard/membership']] },
  { title: 'Help', links: [['Contact us', '/contact'], ['Book a trial', '/contact?topic=visit'], ['FAQ', '/membership#faq'], ['Personal training', '/programs/personal-training']] },
]

export function Footer() {
  const gym = useGym()
  const status = openStatus(gym.hoursWeekdays, gym.hoursWeekends)

  return (
    <footer className="relative z-[1] overflow-hidden bg-ink text-white">
      {/* top edge light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      <div className="glow-cyan pointer-events-none absolute -top-56 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA strip */}
        <div className="card-dark mt-14 flex flex-col items-start justify-between gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-[0.2em] text-cyan-300 uppercase">Your first session is on us</p>
            <p className="font-wide mt-2 text-2xl leading-tight font-black uppercase sm:text-3xl">Ready to reach your apex?</p>
          </div>
          <div className="relative flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Button to="/contact?topic=visit" variant="primary" arrow>Book a free trial</Button>
            <Button to="/membership" variant="light">View plans</Button>
          </div>
        </div>

        <div className="grid gap-12 py-14 lg:grid-cols-[1.15fr_2fr]">
          <div>
            <Logo tone="light" size="lg" />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
              Premium strength & conditioning in {gym.address.split(',')[0] || 'Dhubulia'}. Join at the front desk, then track your membership online.
            </p>
            {status && (
              <p className={`mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1 ${status.open ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' : 'bg-white/5 text-white/70 ring-white/10'}`}>
                <span className="relative flex size-2">
                  {status.open && <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-emerald-300" />}
                  <span className={`relative inline-flex size-2 rounded-full ${status.open ? 'bg-emerald-300' : 'bg-white/40'}`} />
                </span>
                {status.label}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map(([label, to]) => (
                    <li key={label}>
                      <Link to={to!} className="group inline-flex items-center gap-1 py-0.5 text-[15px] text-white/70 transition-colors duration-300 hover:text-white">
                        <span className="link-u">{label}</span>
                        <ArrowUpRight className="size-3.5 -translate-x-1 text-cyan-300 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact tiles */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: MapPin, label: 'Visit', value: gym.address, href: gym.mapUrl || undefined },
            { icon: Clock, label: 'Hours', value: `Mon–Sat ${gym.hoursWeekdays} · Sun ${gym.hoursWeekends}` },
            { icon: Phone, label: 'Call', value: gym.phone, href: gym.phone ? telHref(gym.phone) : undefined },
            gym.whatsapp
              ? { icon: MessageCircle, label: 'WhatsApp', value: gym.whatsapp, href: waHref(gym.whatsapp, 'Hi Apex Fitness!') }
              : { icon: Mail, label: 'Email', value: gym.email, href: gym.email ? `mailto:${gym.email}` : undefined },
          ].map((t) => {
            const inner = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-cyan-300 ring-1 ring-white/10 transition duration-500 group-hover:rotate-[-8deg] group-hover:bg-cyan-400 group-hover:text-ink">
                  <t.icon className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[10.5px] tracking-[0.18em] text-white/40 uppercase">{t.label}</span>
                  <span className="mt-0.5 block text-[13.5px] leading-snug text-white/80">{t.value || '—'}</span>
                </span>
              </>
            )
            const cls = 'group card-dark flex items-start gap-3 rounded-2xl p-4 transition duration-500 hover:-translate-y-0.5 hover:border-cyan-400/30'
            return t.href ? (
              <a key={t.label} href={t.href} target={t.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={cls}>{inner}</a>
            ) : (
              <div key={t.label} className={cls}>{inner}</div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 py-6 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Apex Fitness, Dhubulia. All rights reserved.</p>
          <div className="flex items-center justify-between gap-5">
            <p>Memberships are sold at our front desk only.</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/15 transition duration-500 hover:-translate-y-1 hover:bg-cyan-400 hover:text-ink hover:shadow-[0_0_24px_rgb(34_211_238/0.6)]"
              aria-label="Back to top"
            >
              <ArrowUp className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
