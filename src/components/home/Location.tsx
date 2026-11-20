import { Clock, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react'
import { directionsUrl, mapEmbedUrl } from '../../lib/maps'
import { openStatus } from '../../lib/openStatus'
import { telHref, useGym, waHref } from '../../lib/useGym'
import type { GymInfo } from '../../types'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/Misc'

/** Google map of the gym (place from Admin → Settings → Map location, else the address). */
export function MapEmbed({ gym, className = '' }: { gym: GymInfo; className?: string }) {
  return (
    <iframe
      title={`Map: ${gym.name || 'Apex Fitness'}, ${gym.address}`}
      src={mapEmbedUrl(gym)}
      className={`block w-full border-0 ${className || 'h-full'}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  )
}

export function Location() {
  const gym = useGym()
  const status = openStatus(gym.hoursWeekdays, gym.hoursWeekends)

  const rows = [
    { icon: MapPin, label: 'Address', value: gym.address },
    { icon: Clock, label: 'Opening hours', value: `Mon–Sat ${gym.hoursWeekdays} · Sun ${gym.hoursWeekends}` },
    gym.phone ? { icon: Phone, label: 'Front desk', value: gym.phone, href: telHref(gym.phone) } : null,
    gym.whatsapp ? { icon: MessageCircle, label: 'WhatsApp', value: gym.whatsapp, href: waHref(gym.whatsapp, 'Hi Apex Fitness! I’d like to visit.') } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[]

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <SectionHeading eyebrow="Find us" title="Visit" accent="Apex Fitness." text="Drop by for a tour and a free trial session — we’re easy to find in Dhubulia." />

      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1.45fr]">
        {/* Details */}
        <div className="reveal group card-dark flex flex-col p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgb(34_211_238/0.6)] sm:p-8">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 rounded-[inherit] opacity-50" />
          <div className="relative flex flex-1 flex-col">
            {status && (
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1 ${status.open ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' : 'bg-white/5 text-white/70 ring-white/10'}`}>
                <span className="relative flex size-2">
                  {status.open && <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-emerald-300" />}
                  <span className={`relative inline-flex size-2 rounded-full ${status.open ? 'bg-emerald-300' : 'bg-white/40'}`} />
                </span>
                {status.label}
              </span>
            )}
            <ul className="mt-6 grid gap-4">
              {rows.map((r) => {
                const inner = (
                  <>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-cyan-300 ring-1 ring-white/10 transition-all duration-500 group-hover/row:bg-cyan-400 group-hover/row:text-ink">
                      <r.icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[10.5px] tracking-[0.18em] text-white/45 uppercase">{r.label}</span>
                      <span className="mt-0.5 block text-[15px] leading-snug text-white/85 transition-colors duration-500 group-hover/row:text-white">{r.value}</span>
                    </span>
                  </>
                )
                return (
                  <li key={r.label}>
                    {r.href ? (
                      <a href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="group/row flex items-start gap-3.5">
                        {inner}
                      </a>
                    ) : (
                      <div className="group/row flex items-start gap-3.5">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row lg:flex-col xl:flex-row">
              <Button href={directionsUrl(gym)} target="_blank" variant="primary" icon={<Navigation className="size-4" />}>
                Get directions
              </Button>
              <Button to="/contact?topic=visit" variant="light" arrow>
                Book a free trial
              </Button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div
          className="reveal group relative min-h-[340px] overflow-hidden rounded-3xl border border-line bg-canvas-2 shadow-card transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/40 hover:shadow-[0_30px_60px_-30px_rgb(6_182_212/0.55)] sm:min-h-[420px]"
          style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
        >
          <MapEmbed gym={gym} className="absolute inset-0 h-full" />
        </div>
      </div>
    </section>
  )
}
