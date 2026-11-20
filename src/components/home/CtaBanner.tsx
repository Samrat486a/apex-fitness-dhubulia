import { BellRing, CalendarClock, LogIn, Mail, MessageCircle, UserPlus } from 'lucide-react'
import { Button } from '../ui/Button'
import { ProgressRing } from '../ui/ProgressRing'

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="reveal relative overflow-hidden rounded-[36px] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
        <div className="bg-grid-dark pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-[30rem] rounded-full glow-cyan" />
        <div className="pointer-events-none absolute top-10 right-10 size-40 rounded-full border border-cyan-400/20" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-cyan-300 uppercase">
              <CalendarClock className="size-3.5" /> For members
            </span>
            <h2 className="font-wide mt-6 text-4xl leading-[0.98] font-black tracking-[-0.03em] uppercase sm:text-6xl">
              Already training
              <br />
              <span className="text-cyan-300">with us?</span>
            </h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/65">
              Link the membership you bought at the front desk and get your days remaining, renewal reminders on WhatsApp & email, and your profile — all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/register" variant="primary" size="lg" icon={<UserPlus className="size-4" />}>
                Create your account
              </Button>
              <Button to="/login" variant="light" size="lg" icon={<LogIn className="size-4" />}>
                Sign in
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="spot rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-500 hover:-translate-y-1 hover:border-cyan-300/30 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">Member dashboard</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-300" /> Live
                </span>
              </div>
              <div className="mt-5 flex flex-col items-center gap-5 min-[420px]:flex-row">
                <ProgressRing value={0.86} size={116} stroke={10}>
                  <span className="font-wide text-3xl leading-none font-black">5</span>
                  <span className="text-[10px] text-white/55">days left</span>
                </ProgressRing>
                <div className="grid w-full flex-1 gap-2.5 text-sm">
                  {[
                    ['Plan', 'Half-Yearly'],
                    ['Started', '8 Apr 2026'],
                    ['Expires', '5 Oct 2026'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-white/10 pb-2">
                      <span className="text-white/50">{k}</span>
                      <span className="text-right font-semibold whitespace-nowrap">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                {[
                  [BellRing, 'Dashboard'],
                  [Mail, 'Email'],
                  [MessageCircle, 'WhatsApp'],
                ].map(([Icon, label]) => {
                  const I = Icon as typeof Mail
                  return (
                    <div key={label as string} className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 min-[360px]:block min-[360px]:text-center">
                      <I className="size-4 shrink-0 text-cyan-300 min-[360px]:mx-auto" />
                      <p className="text-[11px] font-semibold text-white/80 min-[360px]:mt-1.5">{label as string}</p>
                      <p className="ml-auto text-[10px] text-emerald-300 min-[360px]:ml-0">Sent</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 animate-float rounded-2xl bg-cyan-400 px-4 py-2.5 text-[13px] font-bold text-ink shadow-lift sm:-left-6">
              Renewal reminder sent ✓
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
