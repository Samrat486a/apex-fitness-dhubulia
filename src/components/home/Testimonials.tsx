import { Quote, Star } from 'lucide-react'
import { TESTIMONIALS } from '../../config/site'
import { initials } from '../../lib/format'
import { SectionHeading } from '../ui/Misc'

function Stars({ value, className = 'size-4' }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1).replace('.0', '')} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((n) => {
        const fill = Math.min(Math.max(value - n, 0), 1) // 0 → empty, 1 → full, in between → partly filled
        return (
          <span key={n} className="relative inline-block">
            <Star className={`${className} fill-ink/10 text-ink/10`} strokeWidth={1.5} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${className} fill-amber-400 text-amber-400`} strokeWidth={1.5} />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

function Card({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <figure className="group card w-[300px] shrink-0 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift sm:w-[360px]">
      <div className="flex items-center justify-between">
        <Quote className="size-6 text-cyan-500 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-125" />
        <Stars value={t.rating} />
      </div>
      <blockquote className="mt-4 text-[15px] leading-relaxed text-ink/80">“{t.quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <span className="grid size-10 place-items-center rounded-full bg-ink text-xs font-bold text-cyan-300 transition duration-500 group-hover:bg-cyan-400 group-hover:text-ink">{initials(t.name)}</span>
        <span>
          <span className="block text-sm font-bold">{t.name}</span>
          <span className="block text-[12.5px] text-muted">{t.tag}</span>
        </span>
      </figcaption>
    </figure>
  )
}

/** Average of the reviews actually listed, so it always matches the cards. */
function RatingSummary() {
  const avg = TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / TESTIMONIALS.length
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full bg-white py-2 pr-4 pl-2 sm:gap-3 sm:pr-5 shadow-card ring-1 ring-line">
      <span className="font-wide grid h-9 min-w-12 place-items-center rounded-full bg-ink px-3 text-[15px] font-black text-white">{avg.toFixed(1)}</span>
      <Stars value={avg} className="size-[18px]" />
      <span className="text-sm font-semibold whitespace-nowrap text-muted">
        {TESTIMONIALS.length} <span className="hidden sm:inline">member </span>reviews
      </span>
    </div>
  )
}

export function Testimonials() {
  const half = Math.ceil(TESTIMONIALS.length / 2)
  const rows = [TESTIMONIALS.slice(0, half), TESTIMONIALS.slice(half)]
  return (
    <section className="overflow-hidden border-y border-line bg-canvas-2/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Member stories" title="Real people." accent="Real progress." align="center" action={<RatingSummary />} />
      </div>
      <div className="mask-fade-x mt-4 space-y-1 py-6">
        {rows.map((row, r) => (
          <div key={r} className="group/row flex py-2">
            <div
              className="flex w-max gap-5 pr-5 group-hover/row:[animation-play-state:paused]"
              style={{ animation: `marquee ${46 + r * 8}s linear infinite`, animationDirection: r ? 'reverse' : 'normal' }}
            >
              {[...row, ...row, ...row, ...row].map((t, i) => (
                <Card key={i} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
