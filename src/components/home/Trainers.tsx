import { Check } from 'lucide-react'
import { useState } from 'react'
import { COACH } from '../../config/site'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/Misc'

/**
 * Single-coach section: the coach's photo slowly fades from black & white to colour on hover
 * (starting a beat after the pointer arrives) or on tap on phones (tap again to switch back).
 */
export function Trainers() {
  const [colour, setColour] = useState(false)

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow="Coaching" title="Coached with" accent="real expertise." text="Personal attention on every visit — technique, programming and accountability from your very first session." />
          <ul className="mt-8 grid gap-3">
            {COACH.promises.map((p, i) => (
              <li
                key={p}
                style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
                className="reveal group card flex items-center gap-3.5 p-4 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-28px_rgb(6_182_212/0.55)]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-cyan-300 transition-all duration-500 group-hover:bg-cyan-400 group-hover:text-ink">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <span className="text-[15px] font-semibold transition-colors duration-500 group-hover:text-cyan-700">{p}</span>
              </li>
            ))}
          </ul>
          <div className="reveal mt-8">
            <Button to="/programs/personal-training" variant="dark" arrow>Explore personal training</Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setColour((c) => !c)}
          aria-pressed={colour}
          aria-label={colour ? 'Show the coach photo in black and white' : 'Show the coach photo in colour'}
          data-on={colour}
          className="reveal group relative mx-auto block w-full max-w-md cursor-pointer rounded-[36px] text-left transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,0.8,0.3,1)] hover:-translate-y-1.5 hover:delay-150 data-[on=true]:-translate-y-1.5 lg:max-w-none"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-ink shadow-lift transition-shadow duration-[1200ms] ease-[cubic-bezier(0.22,0.8,0.3,1)] group-hover:shadow-[0_40px_80px_-36px_rgb(10_14_17/0.55)] group-hover:delay-150 group-data-[on=true]:shadow-[0_40px_80px_-36px_rgb(10_14_17/0.55)]">
            <img
              src={COACH.image}
              alt="Apex Fitness coach"
              loading="lazy"
              decoding="async"
              className="size-full object-cover object-[center_18%] grayscale transition-[filter] duration-[1200ms] ease-[cubic-bezier(0.22,0.8,0.3,1)] group-hover:grayscale-0 group-hover:delay-150 group-data-[on=true]:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,0.8,0.3,1)] group-hover:opacity-0 group-hover:delay-150 group-data-[on=true]:opacity-0" />
          </div>
        </button>
      </div>
    </section>
  )
}
