import { Bell, CalendarCheck2, Eye, EyeOff, KeyRound, Lock, Mail, Phone, User as UserIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Checkbox, Input } from '../components/ui/Field'
import { IMAGES } from '../config/site'
import { homeFor, useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { API_MODE, errorMessage, fieldErrors } from '../lib/api'
import { usePageTitle } from '../lib/hooks'

function AuthShell({ children, quote, sub }: { children: ReactNode; quote: string; sub: string }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-8 lg:pt-10">
      <div className="mx-auto w-full max-w-md animate-fade-up py-4 lg:py-10">{children}</div>
      <div className="relative hidden min-h-[640px] overflow-hidden rounded-[36px] bg-ink lg:block">
        <img src={IMAGES.auth} alt="" className="absolute inset-0 size-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div className="bg-grid-dark absolute inset-0 opacity-50" />
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full glow-cyan" />
        <div className="absolute inset-x-10 bottom-10 text-white">
          <div className="mb-8 grid gap-3">
            {[
              [CalendarCheck2, 'See your plan, start & expiry dates'],
              [Bell, 'Reminders 5 and 3 days before expiry'],
              [KeyRound, 'Your profile, safely in one place'],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Bell
              return (
                <div key={text as string} className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 py-2 pr-4 pl-2 text-sm backdrop-blur">
                  <span className="grid size-7 place-items-center rounded-full bg-cyan-400 text-ink"><I className="size-3.5" /></span>
                  {text as string}
                </div>
              )
            })}
          </div>
          <p className="font-wide text-3xl leading-tight font-black uppercase">“{quote}”</p>
          <p className="mt-3 font-mono text-xs tracking-[0.18em] text-cyan-300 uppercase">{sub}</p>
        </div>
      </div>
    </section>
  )
}

function DemoAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  const [accounts, setAccounts] = useState<{ label: string; email: string; password: string }[]>([])
  useEffect(() => {
    if (API_MODE === 'mock') void import('../lib/mock').then((m) => setAccounts(m.DEMO_ACCOUNTS))
  }, [])
  if (!accounts.length) return null
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-cyan-500/50 bg-cyan-50/60 p-4">
      <p className="font-mono text-[10.5px] font-semibold tracking-[0.18em] text-cyan-800 uppercase">Demo mode · try an account</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {accounts.map((a) => (
          <button key={a.email} type="button" onClick={() => onPick(a.email, a.password)} className="rounded-xl bg-white px-3 py-2.5 text-left text-sm ring-1 ring-line transition hover:ring-cyan-500">
            <span className="block font-bold">{a.label}</span>
            <span className="block truncate text-[12px] text-muted">{a.email}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function LoginPage() {
  usePageTitle('Sign in')
  const { login, user, ready } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (ready && user) navigate(homeFor(user), { replace: true })
  }, [ready, user, navigate])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setFormError('')
    try {
      const u = await login(email, password)
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`)
      navigate(from && u.role === 'member' && !from.startsWith('/admin') ? from : homeFor(u), { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell quote="Discipline is built one rep at a time." sub="Apex Fitness · Dhubulia">
      <p className="eyebrow">Member access</p>
      <h1 className="font-wide mt-4 text-5xl leading-none font-black uppercase">Welcome back.</h1>
      <p className="mt-3 text-muted">Sign in to see your membership, reminders and profile.</p>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-5">
        {formError && !Object.keys(errors).length && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{formError}</p>
        )}
        <Input label="Email" type="email" required icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" placeholder="you@example.com" />
        <div className="relative">
          <Input label="Password" type={show ? 'text' : 'password'} required icon={<Lock />} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="current-password" placeholder="••••••••" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-[38px] right-3 rounded-lg p-1.5 text-ink/45 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link to="/contact?topic=general" className="text-[13px] font-semibold text-cyan-700 hover:text-cyan-600">Forgot password? Ask the front desk</Link>
        </div>
        <Button type="submit" variant="dark" size="lg" block loading={busy} arrow>Sign in</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        New to Apex online? <Link to="/register" className="font-bold text-ink hover:text-cyan-700">Create your account</Link>
      </p>
      <DemoAccounts onPick={(em, pw) => { setEmail(em); setPassword(pw) }} />
    </AuthShell>
  )
}

function strength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++
  return s
}

export function RegisterPage() {
  usePageTitle('Create account')
  const { register, user, ready } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [accept, setAccept] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(({ [k]: _cleared, ...rest }) => rest)
  }
  const s = strength(form.password)

  useEffect(() => {
    if (ready && user && !busy) navigate(homeFor(user), { replace: true })
  }, [ready, user, navigate, busy])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.confirmPassword !== form.password) {
      setErrors({ confirmPassword: form.confirmPassword ? 'Passwords don’t match.' : 'Please confirm your password.' })
      return
    }
    setBusy(true)
    setErrors({})
    try {
      await register({ ...form, acceptTerms: accept })
      toast.success('Account created', 'One more step — tell us about your membership.')
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error('Couldn’t create your account', errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthShell quote="Your strongest self starts with one decision." sub="Join the Apex community">
      <p className="eyebrow">Step 1 of 2 · Account</p>
      <h1 className="font-wide mt-4 text-5xl leading-none font-black uppercase">Join <span className="text-apex">Apex</span> online.</h1>
      <p className="mt-3 text-muted">Create your account to link your gym membership and get renewal reminders.</p>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-5">
        <Input label="Full name" required icon={<UserIcon />} value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="Your full name" />
        <Input label="Email" type="email" required icon={<Mail />} value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="you@example.com" />
        <Input label="Mobile number" type="tel" inputMode="tel" required icon={<Phone />} value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" placeholder="98XXX XXXXX" hint="Used for WhatsApp membership reminders." />
        <div>
          <div className="relative">
            <Input label="Password" type={show ? 'text' : 'password'} required icon={<Lock />} value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-[38px] right-3 rounded-lg p-1.5 text-ink/45 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </div>
          {form.password && !errors.password && (
            <div className="mt-2 flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < s ? (s >= 3 ? 'bg-cyan-500' : 'bg-amber-400') : 'bg-ink/10'}`} />
              ))}
              <span className="w-14 text-right text-[12px] font-semibold text-muted">{['Weak', 'Weak', 'Okay', 'Good', 'Strong'][s]}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Input
            label="Confirm password"
            type={show ? 'text' : 'password'}
            required
            icon={<Lock />}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
            placeholder="Type your password again"
            hint={form.confirmPassword ? (form.confirmPassword === form.password ? <span className="font-semibold text-emerald-600">✓ Passwords match</span> : <span className="font-semibold text-amber-600">Passwords don’t match yet</span>) : undefined}
          />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-[38px] right-3 rounded-lg p-1.5 text-ink/45 hover:text-ink" aria-label={show ? 'Hide passwords' : 'Show passwords'}>
            {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </div>
        <Checkbox checked={accept} onChange={setAccept} error={errors.acceptTerms}>
          I agree that Apex Fitness may store my details to manage my membership and send reminders.
        </Checkbox>
        <Button type="submit" variant="primary" size="lg" block loading={busy} arrow>Create account</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-bold text-ink hover:text-cyan-700">Sign in</Link>
      </p>
    </AuthShell>
  )
}
