import { CalendarDays, Info, ReceiptText, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useLoad } from '../../lib/hooks'
import { calcExpiry, isValidISO, membershipState, todayISO } from '../../lib/membership'
import type { Gender, Membership, User } from '../../types'
import { StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Field'
import { Skeleton } from '../ui/Misc'
import { ProgressRing } from '../ui/ProgressRing'

/**
 * "Add your membership" form: personal + membership details, with a live summary that
 * calculates the expiry date and days remaining as the member types. The server repeats
 * the calculation and is the source of truth.
 */
export function MembershipForm({ user, onSaved, submitLabel = 'Save membership' }: { user: User; onSaved: (m: Membership, u: User) => void; submitLabel?: string }) {
  const toast = useToast()
  const plans = useLoad(() => api.plans().then((r) => r.data.plans), [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [durationTouched, setDurationTouched] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone?.replace(/^\+91/, '') ?? '',
    dateOfBirth: user.dateOfBirth ?? '',
    gender: (user.gender ?? '') as Gender | '',
    address: user.address ?? '',
    planId: '' as number | '',
    purchaseDate: todayISO(),
    startDate: todayISO(),
    durationDays: '' as number | '',
    receiptNumber: '',
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(({ [k]: _drop, ...rest }) => rest)
  }

  const plan = plans.data?.find((p) => p.id === form.planId)

  // Choosing a plan fills its duration (unless staff gave a custom number of days).
  useEffect(() => {
    if (plan && !durationTouched) setForm((f) => ({ ...f, durationDays: plan.durationDays }))
  }, [plan, durationTouched])

  const preview = useMemo(() => {
    const d = Number(form.durationDays)
    if (!isValidISO(form.startDate) || !d || d < 1) return null
    const expiry = calcExpiry(form.startDate, d)
    return { expiry, ...membershipState(form.startDate, expiry, d) }
  }, [form.startDate, form.durationDays])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const r = await api.addMembership({ ...form })
      toast.success('Membership added', `Expires on ${formatDate(r.data.membership.expiryDate)}.`)
      onSaved(r.data.membership, r.data.user)
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error('Please check the form', errorMessage(err))
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      setBusy(false)
    }
  }

  const today = todayISO()

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-6">
        <fieldset className="card p-6 sm:p-8">
          <legend className="sr-only">Personal information</legend>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-ink font-mono text-sm font-bold text-cyan-300">01</span>
            <div>
              <h2 className="font-wide text-lg font-extrabold uppercase">Personal information</h2>
              <p className="text-[13px] text-muted">As registered at the front desk.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input label="Full name" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} autoComplete="name" />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="email" />
            <Input label="Phone number" type="tel" inputMode="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="98XXX XXXXX" autoComplete="tel" />
            <Input label="Date of birth" type="date" required value={form.dateOfBirth} max={today} onChange={(e) => set('dateOfBirth', e.target.value)} error={errors.dateOfBirth} />
            <Select label="Gender" required value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)} error={errors.gender}>
              <option value="" disabled>Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </Select>
            <Textarea className="sm:col-span-2" label="Address" required rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} error={errors.address} placeholder="House / street, area, town, PIN" autoComplete="street-address" />
          </div>
        </fieldset>

        <fieldset className="card p-6 sm:p-8">
          <legend className="sr-only">Membership information</legend>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 font-mono text-sm font-bold text-ink">02</span>
            <div>
              <h2 className="font-wide text-lg font-extrabold uppercase">Membership information</h2>
              <p className="text-[13px] text-muted">From your Apex Fitness receipt.</p>
            </div>
          </div>

          <p className="mt-6 mb-2 text-[13px] font-semibold text-ink/80">Membership plan <span className="text-cyan-600">*</span></p>
          {plans.loading && !plans.data ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Membership plan">
              {plans.data?.map((p) => {
                const active = form.planId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setDurationTouched(false)
                      set('planId', p.id)
                    }}
                    className={`rounded-2xl border p-3.5 text-left transition-all duration-300 ${active ? 'border-cyan-500 bg-cyan-50 shadow-[0_0_0_3px_rgb(34_211_238/0.25)]' : 'border-line bg-white hover:border-ink/25'}`}
                  >
                    <span className="block text-sm font-bold">{p.name}</span>
                    <span className={`mt-0.5 block font-mono text-[12px] ${active ? 'text-cyan-700' : 'text-muted'}`}>{p.durationDays} days</span>
                  </button>
                )
              })}
            </div>
          )}
          {errors.planId && <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.planId}</p>}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Input label="Purchase date" type="date" required max={today} value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} error={errors.purchaseDate} />
            <Input label="Start date" type="date" required value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={errors.startDate} hint="The first day you can train." />
            <Input
              label="Membership duration (days)"
              type="number"
              inputMode="numeric"
              min={1}
              max={730}
              required
              value={form.durationDays}
              onChange={(e) => {
                setDurationTouched(true)
                set('durationDays', e.target.value === '' ? '' : Number(e.target.value))
              }}
              error={errors.durationDays}
              hint={plan ? `${plan.name} plans are ${plan.durationDays} days. Change only if the desk gave you extra days.` : 'Filled in when you choose a plan.'}
            />
            <Input label="Receipt number (optional)" value={form.receiptNumber} onChange={(e) => set('receiptNumber', e.target.value)} error={errors.receiptNumber} icon={<ReceiptText />} placeholder="e.g. APX-01042" hint="Helps our team verify faster." />
          </div>
        </fieldset>
      </div>

      {/* Live summary */}
      <aside className="card-dark relative overflow-hidden p-6 lg:sticky lg:top-24">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-60 rounded-full glow-cyan" />
        <div className="relative">
          <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">Your membership</p>
          <div className="mt-5 flex items-center gap-4">
            <ProgressRing value={preview ? 1 - preview.daysRemaining / Math.max(1, Number(form.durationDays)) : 0} size={104} stroke={9}>
              <span className="font-wide text-2xl leading-none font-black">{preview ? preview.daysRemaining : '—'}</span>
              <span className="text-[10px] text-white/55">days left</span>
            </ProgressRing>
            <div>
              <p className="font-wide text-xl font-extrabold uppercase">{plan?.name ?? 'Choose a plan'}</p>
              {preview && <div className="mt-2"><StatusBadge status={preview.status} /></div>}
            </div>
          </div>
          <dl className="mt-6 grid gap-3 text-sm">
            {[
              ['Start date', formatDate(isValidISO(form.startDate) ? form.startDate : null)],
              ['Duration', form.durationDays ? `${form.durationDays} days` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/10 pb-3">
                <dt className="text-white/55">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-cyan-400 px-4 py-3 text-ink">
              <dt className="flex items-center gap-2 text-[13px] font-semibold"><CalendarDays className="size-4" />Expiry date</dt>
              <dd className="font-wide text-base font-black">{preview ? formatDate(preview.expiry) : '—'}</dd>
            </div>
          </dl>
          <p className="mt-4 flex gap-2 text-[12.5px] leading-relaxed text-white/55">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Calculated automatically: start date + duration.
          </p>
          <Button type="submit" variant="primary" size="lg" block loading={busy} className="mt-6" arrow>
            {submitLabel}
          </Button>
          <p className="mt-4 flex gap-2 text-[12.5px] leading-relaxed text-white/55">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-300" /> Our staff verify every membership against the front-desk record.
          </p>
        </div>
      </aside>
    </form>
  )
}
