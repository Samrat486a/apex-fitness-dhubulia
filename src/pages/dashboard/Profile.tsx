import { ChevronRight, Globe, KeyRound, LogOut, Mail, MessageCircle, MessageSquare } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea, Toggle } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { usePageTitle } from '../../lib/hooks'
import { todayISO } from '../../lib/membership'
import type { Gender } from '../../types'

export default function ProfilePage() {
  usePageTitle('Profile')
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone?.replace(/^\+91/, '') ?? '',
    dateOfBirth: user?.dateOfBirth ?? '',
    gender: (user?.gender ?? '') as Gender | '',
    address: user?.address ?? '',
    emailOptIn: user?.emailOptIn ?? true,
    whatsappOptIn: user?.whatsappOptIn ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwBusy, setPwBusy] = useState(false)

  if (!user) return null
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const r = await api.updateProfile(form)
      setUser(r.data.user)
      toast.success('Profile saved')
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error('Couldn’t save your profile', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwBusy(true)
    setPwErrors({})
    try {
      await api.changePassword(pw)
      setPw({ currentPassword: '', newPassword: '' })
      toast.success('Password changed')
    } catch (err) {
      setPwErrors(fieldErrors(err))
      toast.error('Couldn’t change password', errorMessage(err))
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <header className="animate-fade-up">
        <p className="eyebrow">Account</p>
        <h1 className="font-wide mt-3 text-3xl font-black uppercase sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-sm text-muted">Member since {formatDate(user.createdAt)}</p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <form onSubmit={save} noValidate className="card animate-fade-up p-6 sm:p-8">
          <h2 className="font-wide text-lg font-extrabold uppercase">Personal information</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input label="Full name" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            <Input label="Phone number" type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
            <Input label="Date of birth" type="date" required max={todayISO()} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} error={errors.dateOfBirth} />
            <Select label="Gender" required value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)} error={errors.gender}>
              <option value="" disabled>Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </Select>
            <Textarea className="sm:col-span-2" label="Address" required rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="font-bold">Membership reminders</h3>
            <p className="mt-0.5 text-[13px] text-muted">Dashboard reminders are always on.</p>
            <div className="mt-5 grid gap-5">
              <Toggle checked={form.emailOptIn} onChange={(v) => set('emailOptIn', v)} label="Email reminders" description={`Sent to ${form.email || 'your email'}`} />
              <Toggle checked={form.whatsappOptIn} onChange={(v) => set('whatsappOptIn', v)} label="WhatsApp reminders" description="Sent to your mobile number" />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <Button type="submit" variant="dark" loading={busy}>Save changes</Button>
          </div>
        </form>

        <div className="grid gap-6">
          <form onSubmit={changePassword} noValidate className="card animate-fade-up p-6 [animation-delay:80ms] sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-ink text-cyan-300"><KeyRound className="size-5" /></span>
            <h2 className="font-wide mt-5 text-lg font-extrabold uppercase">Change password</h2>
            <div className="mt-5 grid gap-4">
              <Input label="Current password" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} error={pwErrors.currentPassword} />
              <Input label="New password" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} error={pwErrors.newPassword} hint="8+ characters with letters and a number." />
            </div>
            <Button type="submit" variant="outline" className="mt-6" block loading={pwBusy}>Update password</Button>
          </form>
          <div className="card-dark animate-fade-up p-6 [animation-delay:140ms]">
            <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">Reminder channels</p>
            <div className="mt-4 grid gap-3 text-sm">
              <p className="flex items-center gap-3"><Mail className="size-4 text-cyan-300" />Email · {form.emailOptIn ? 'On' : 'Off'}</p>
              <p className="flex items-center gap-3"><MessageCircle className="size-4 text-cyan-300" />WhatsApp · {form.whatsappOptIn ? 'On' : 'Off'}</p>
            </div>
          </div>

          {/* On phones the sidebar is hidden, so account actions live here */}
          <div className="card animate-fade-up overflow-hidden [animation-delay:200ms] lg:hidden">
            {[
              { to: '/contact', icon: MessageSquare, label: 'Contact the gym' },
              { to: '/', icon: Globe, label: 'Back to website' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-3 border-b border-line px-5 py-4 text-[15px] font-semibold active:bg-canvas">
                <l.icon className="size-[18px] text-cyan-600" />
                {l.label}
                <ChevronRight className="ml-auto size-4 text-ink/30" />
              </Link>
            ))}
            <button
              type="button"
              onClick={async () => {
                navigate('/')
                await logout()
                toast.info('Signed out', 'See you on the floor.')
              }}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] font-semibold text-red-600 active:bg-red-50"
            >
              <LogOut className="size-[18px]" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
