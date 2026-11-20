import { ArrowLeft, BadgeCheck, Check, Clock, MapPin, Phone, Store, UserRoundPlus } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MembershipForm } from '../components/membership/MembershipForm'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, errorMessage } from '../lib/api'
import { inr } from '../lib/format'
import { useLoad, usePageTitle } from '../lib/hooks'
import { telHref, useGym } from '../lib/useGym'

type Step = 'ask' | 'form' | 'later'

function Stepper() {
  const items = ['Account', 'Membership', 'Dashboard']
  const at = 1 // account done, membership in progress
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[13px] font-semibold sm:gap-3" aria-label="Progress">
      {items.map((label, i) => (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span className={`grid size-7 place-items-center rounded-full text-[12px] ${i < at ? 'bg-ink text-cyan-300' : i === at ? 'bg-cyan-400 text-ink ring-4 ring-cyan-400/20' : 'bg-white text-ink/40 ring-1 ring-line'}`}>
            {i < at ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
          </span>
          <span className={`${i === at ? '' : 'hidden min-[420px]:inline'} ${i <= at ? 'text-ink' : 'text-ink/40'}`}>{label}</span>
          {i < items.length - 1 && <span className="h-px w-4 bg-ink/15 sm:w-10" />}
        </li>
      ))}
    </ol>
  )
}

export default function Onboarding() {
  usePageTitle('Your membership')
  const { user, setUser } = useAuth()
  const [initialStatus] = useState(user?.onboardingStatus)
  const toast = useToast()
  const navigate = useNavigate()
  const gym = useGym()
  const [step, setStep] = useState<Step>('ask')
  const [busy, setBusy] = useState(false)
  const plans = useLoad(() => api.plans().then((r) => r.data.plans), [])

  if (!user) return null
  // Already answered before opening this page → dashboard. (Answering "Not yet" here must still show the next screen.)
  if (initialStatus !== 'pending') return <Navigate to="/dashboard" replace />

  async function notYet() {
    setBusy(true)
    try {
      const r = await api.setOnboarding('not_member')
      setUser(r.data.user)
      setStep('later')
    } catch (e) {
      toast.error('Something went wrong', errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-10">
      <Stepper />

      {step === 'ask' && (
        <div className="mx-auto mt-12 max-w-3xl animate-fade-up text-center">
          <p className="eyebrow justify-center">Welcome, {user.name.split(' ')[0]}</p>
          <h1 className="font-wide mt-5 text-[34px] leading-[0.98] font-black uppercase sm:text-5xl">
            Have you already purchased an <span className="text-apex">Apex Fitness</span> membership?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">Memberships are bought at our front desk. If you have one, link it now so we can track your dates and remind you before it expires.</p>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            <button
              onClick={() => setStep('form')}
              className="group relative overflow-hidden rounded-[28px] bg-ink p-7 text-left text-white shadow-lift transition-all duration-500 hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" />
              <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full glow-cyan transition-opacity group-hover:opacity-100" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-cyan-400 text-ink"><BadgeCheck className="size-6" /></span>
              <p className="font-wide relative mt-8 text-2xl font-black uppercase">Yes, I’m already a member</p>
              <p className="relative mt-2 text-sm text-white/60">Add your plan, purchase and start dates — we’ll calculate your expiry.</p>
              <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-300">Link my membership →</span>
            </button>
            <button
              onClick={notYet}
              disabled={busy}
              className="group card relative overflow-hidden p-7 text-left transition-all duration-500 hover:-translate-y-1 hover:border-ink/25 hover:shadow-lift disabled:opacity-60"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-canvas text-ink ring-1 ring-line"><UserRoundPlus className="size-6" /></span>
              <p className="font-wide mt-8 text-2xl font-black uppercase">Not yet</p>
              <p className="mt-2 text-sm text-muted">See our plans and how to join at the gym. You can link a membership any time later.</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink">{busy ? 'Saving…' : 'Show me how to join →'}</span>
            </button>
          </div>
        </div>
      )}

      {step === 'form' && (
        <div className="mt-10 animate-fade-up">
          <button onClick={() => setStep('ask')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Back
          </button>
          <h1 className="font-wide mt-4 text-4xl leading-none font-black uppercase sm:text-5xl">Link your membership.</h1>
          <p className="mt-3 max-w-2xl text-muted">Fill in your details exactly as on your Apex Fitness receipt.</p>
          <div className="mt-8">
            <MembershipForm
              user={user}
              submitLabel="Save & open dashboard"
              onSaved={(_m, u) => {
                setUser(u)
                navigate('/dashboard', { replace: true })
              }}
            />
          </div>
        </div>
      )}

      {step === 'later' && (
        <div className="mt-12 grid animate-fade-up gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">No problem</p>
            <h1 className="font-wide mt-4 text-4xl leading-none font-black uppercase sm:text-5xl">
              Visit Apex to <span className="text-apex">get started.</span>
            </h1>
            <p className="mt-4 max-w-lg text-muted">Memberships are purchased in person at our front desk. Once you join, come back here and link it from your dashboard in under a minute.</p>
            <ul className="mt-8 grid gap-3">
              {[
                [MapPin, gym.address],
                [Clock, `Mon–Sat ${gym.hoursWeekdays} · Sun ${gym.hoursWeekends}`],
                [Phone, gym.phone || 'Call the front desk'],
              ].map(([Icon, text]) => {
                const I = Icon as typeof MapPin
                return (
                  <li key={text as string} className="card flex items-center gap-3 p-4 text-sm font-medium">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-cyan-300"><I className="size-4.5" /></span>
                    {I === Phone && gym.phone ? <a href={telHref(gym.phone)} className="hover:text-cyan-700">{text as string}</a> : (text as string)}
                  </li>
                )
              })}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/dashboard" variant="dark" size="lg" arrow>Go to my dashboard</Button>
              <Button to="/contact?topic=visit" variant="outline" size="lg">Book a free trial</Button>
            </div>
          </div>
          <div className="card-dark relative overflow-hidden p-6 sm:p-8">
            <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative">
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase"><Store className="size-3.5" /> Plans at the front desk</p>
              <div className="mt-5 grid gap-3">
                {plans.data?.map((p) => (
                  <div key={p.id} className={`flex items-center justify-between rounded-2xl px-4 py-3.5 ${p.isFeatured ? 'bg-cyan-400 text-ink' : 'bg-white/5 ring-1 ring-white/10'}`}>
                    <div>
                      <p className="font-wide font-extrabold uppercase">{p.name}</p>
                      <p className={`text-[12px] ${p.isFeatured ? 'text-ink/70' : 'text-white/50'}`}>{p.durationDays} days</p>
                    </div>
                    <p className="font-wide text-lg font-black">{p.price !== null ? inr(p.price) : '—'}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[12.5px] text-white/50">Prices are paid at the gym. No online payments.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
