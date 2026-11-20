import { ArrowRight, BellRing, Flame, Mail, MapPin, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IMAGES, srcSet } from '../../config/site'
import { openStatus } from '../../lib/openStatus'
import { useGym } from '../../lib/useGym'
import { Button } from '../ui/Button'
import { ProgressRing } from '../ui/ProgressRing'

const FOCUS = ['Strength', 'Fat loss', 'Conditioning', 'Mobility', 'Personal training']

export function Hero() {
  const gym = useGym()
  // Live status from the opening hours in Admin → Settings (falls back to "Now open" if they can't be read)
  const status = openStatus(gym.hoursWeekdays, gym.hoursWeekends)
  const isOpen = status?.open ?? true
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute top-24 -right-40 size-[38rem] rounded-full glow-cyan" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-8 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:px-8 lg:pt-16 lg:pb-24">
        {/* Copy */}
        <div className="min-w-0">
          <Link
            to="/contact?topic=visit"
            className="group inline-flex animate-fade-up items-center gap-2.5 rounded-full border border-line bg-white/90 py-1.5 pr-3.5 pl-1.5 text-[13px] font-semibold text-ink/75 shadow-card backdrop-blur transition hover:border-ink/20"
          >
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[10.5px] tracking-wider whitespace-nowrap text-cyan-300 uppercase">
              <span className="relative flex size-1.5">
                {isOpen && <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-cyan-300" />}
                <span className={`relative inline-flex size-1.5 rounded-full ${isOpen ? 'bg-cyan-300' : 'bg-white/40'}`} />
              </span>
              {isOpen ? 'Open now' : 'Closed now'}
            </span>
            <span className="whitespace-nowrap">
              Book a free trial<span className="hidden min-[370px]:inline"> in Dhubulia</span>
            </span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1
            className="font-wide mt-7 animate-fade-up text-[clamp(2rem,12.4vw,5.25rem)] leading-[0.9] font-black tracking-[-0.045em] uppercase [animation-delay:80ms] lg:text-[clamp(3rem,6.2vw,5.25rem)]"
          >
            <span className="block">Train</span>
            <span className="block pb-[0.16em]">
              <span className="relative inline-block">
                <span className="text-apex">strong.</span>
                {/* single accent bar */}
                <span aria-hidden className="absolute bottom-[-0.1em] left-0 h-[0.085em] w-[42%] origin-left -skew-x-12 animate-bar rounded-sm bg-cyan-400 [animation-delay:300ms]" />
              </span>
            </span>
            <span className="mt-1 block">Live</span>
            <span className="relative inline-block">
              <span className="text-apex">stronger.</span>
              {/* double accent: bar + short dash, drawing in after the "strong." bar */}
              <span aria-hidden className="absolute bottom-[-0.1em] left-0 flex h-[0.085em] w-full gap-[0.12em]">
                <span className="w-[46%] origin-left -skew-x-12 animate-bar rounded-sm bg-cyan-400 [animation-delay:450ms]" />
                <span className="w-[10%] origin-left -skew-x-12 animate-bar rounded-sm bg-cyan-400/55 [animation-delay:670ms]" />
              </span>
            </span>
          </h1>

          <p className="mt-9 max-w-xl animate-fade-up text-lg leading-relaxed text-ink/70 [animation-delay:160ms] sm:text-xl">
            Build strength, improve your fitness, and become the strongest version of yourself at Apex Fitness.
          </p>

          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Button to="/membership" variant="primary" size="lg" arrow>
              Explore Membership
            </Button>
            <Button to="/contact?topic=visit" variant="outline" size="lg" icon={<MapPin className="size-4 text-cyan-600" />}>
              Visit Apex Fitness
            </Button>
          </div>

          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-2 [animation-delay:320ms]">
            <span className="mr-1 text-[13px] font-semibold text-muted">Train for:</span>
            {FOCUS.map((f) => (
              <Link key={f} to="/programs" className="rounded-full border border-line bg-white/80 px-3 py-1.5 text-[13px] font-semibold text-ink/75 transition duration-500 hover:-translate-y-0.5 hover:border-cyan-500 hover:bg-ink hover:text-white">
                {f}
              </Link>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-[520px] animate-fade-up [animation-delay:200ms] lg:max-w-none">
          <div className="group/hero relative ml-auto aspect-[4/5] w-[86%] overflow-hidden rounded-[36px] bg-ink shadow-lift sm:w-[78%]">
            <img src={IMAGES.hero} srcSet={srcSet(IMAGES.hero, [480, 800, 1200])} sizes="(min-width: 1024px) 40vw, 90vw" alt="Member pressing a barbell overhead at Apex Fitness" className="size-full object-cover transition-transform duration-[1.5s] ease-out group-hover/hero:scale-105" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
            <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay" />
            <span className="absolute top-5 right-5 rounded-full bg-ink/40 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur">
              Open {gym.hoursWeekdays}
            </span>
            <div className="absolute right-5 bottom-5 hidden max-w-[60%] text-right text-white sm:block">
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-cyan-300 uppercase">Strength floor</p>
              <p className="font-wide mt-1 text-lg leading-tight font-extrabold uppercase sm:text-xl">Lift. Recover. Repeat.</p>
            </div>
          </div>

          {/* Membership card */}
          <div className="absolute top-8 left-0 w-[72%] max-w-[250px] animate-float min-[360px]:w-[64%] sm:w-[58%] rounded-3xl border border-white/10 bg-ink/90 p-4 text-white shadow-lift backdrop-blur-xl sm:top-10 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">My membership</p>
              <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">Active</span>
            </div>
            <div className="mt-3 flex items-center gap-3 sm:gap-3.5">
              <ProgressRing value={0.73} size={78} stroke={8}>
                <span className="font-wide text-xl leading-none font-extrabold">66</span>
                <span className="text-[9px] text-white/50">days left</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="font-wide text-[15px] font-extrabold sm:text-base">Quarterly</p>
                <p className="text-[11px] text-white/55">Expires 6 Dec</p>
              </div>
            </div>
          </div>

          {/* Reminder toast */}
          <div className="absolute top-[46%] -right-1 w-[64%] max-w-[270px] animate-float-slow rounded-2xl border border-line bg-white p-3.5 shadow-lift [animation-delay:1.2s] sm:-right-4">
            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400 text-ink">
                <BellRing className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] leading-tight font-bold">Membership expires in 5 days</p>
                <div className="mt-2 flex gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"><MessageCircle className="size-3" />WhatsApp</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"><Mail className="size-3" />Email</span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="absolute bottom-6 left-[4%] w-[52%] max-w-[230px] animate-float rounded-2xl border border-line bg-white/95 p-3.5 shadow-lift backdrop-blur [animation-delay:2.1s]">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-cyan-600" />
              <p className="text-[12px] font-bold">Training streak</p>
              <span className="font-wide ml-auto text-sm font-extrabold">12d</span>
            </div>
            <div className="mt-2.5 flex h-10 items-end gap-1.5">
              {[45, 70, 52, 88, 64, 95, 78].map((h, i) => (
                <span key={i} className={`flex-1 rounded-md ${i === 5 ? 'bg-cyan-400' : 'bg-ink/10'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kinetic band */}
      <div className="relative -left-[2%] mb-2 w-[104%] -rotate-1 overflow-hidden bg-ink py-4 text-white">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-10" aria-hidden={k === 1}>
              {['Strength', 'Conditioning', 'Mobility', 'Coaching', 'Discipline', 'Community', 'Recovery', 'Power'].map((w) => (
                <span key={w} className="font-wide flex items-center gap-10 text-2xl font-black tracking-tight uppercase">
                  {w}
                  <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
                    <path d="M16 4 27 26h-5.8L16 15.2 10.8 26H5Z" fill="#22D3EE" />
                  </svg>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
