import { ClipboardCheck, MapPinned, MonitorSmartphone } from 'lucide-react'
import { STEPS } from '../../config/site'
import { SectionHeading } from '../ui/Misc'

const ICONS = [MapPinned, ClipboardCheck, MonitorSmartphone]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <SectionHeading eyebrow="How it works" title="From first visit to" accent="your dashboard." text="Three simple steps. Your membership lives at the gym — and in your pocket." />
      <div className="relative mt-12 grid gap-5 md:grid-cols-3">
        <div className="pointer-events-none absolute top-[3.6rem] right-[16%] left-[16%] hidden border-t-2 border-dashed border-ink/15 md:block" />
        {STEPS.map((s, i) => {
          const Icon = ICONS[i]!
          return (
            <div
              key={s.title}
              style={{ '--reveal-delay': `${i * 110}ms` } as React.CSSProperties}
              className="reveal group card p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgb(6_182_212/0.55)]"
            >
              <div className="flex items-start justify-between">
                <span className="font-wide text-outline text-[68px] leading-none font-black text-ink/20 transition-colors duration-500 group-hover:text-cyan-500">
                  0{i + 1}
                </span>
                <span className="relative z-10 grid size-12 place-items-center rounded-2xl bg-ink text-white transition-all duration-500 group-hover:bg-cyan-400 group-hover:text-ink">
                  <Icon className="size-5" />
                </span>
              </div>
              <h3 className="font-wide mt-6 text-xl font-extrabold uppercase transition-colors duration-500 group-hover:text-cyan-700">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
