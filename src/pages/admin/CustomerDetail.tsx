import { ArrowLeft, Check, KeyRound, Mail, MessageCircle, Pencil, Phone, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../../components/admin/Parts'
import { CHANNEL_ICON } from '../../components/dashboard/Widgets'
import { DeliveryBadge, StatusBadge, VerificationBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea, Toggle } from '../../components/ui/Field'
import { ErrorState, PageLoader } from '../../components/ui/Misc'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage, fieldErrors, type CustomerAction } from '../../lib/api'
import { formatDate, formatDateTime, formatPhone } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'
import { calcExpiry, isValidISO, todayISO } from '../../lib/membership'
import { telHref, waHref } from '../../lib/useGym'
import type { AdminCustomer, CustomerDetail, Gender, Membership } from '../../types'

function MembershipModal({ open, onClose, editing, onSubmit }: { open: boolean; onClose: () => void; editing: Membership | null; onSubmit: (payload: Record<string, unknown>) => Promise<Record<string, string> | null> }) {
  const plans = useLoad(() => api.plans().then((r) => r.data.plans), [])
  const [form, setForm] = useState({ planId: '' as number | '', purchaseDate: todayISO(), startDate: todayISO(), durationDays: '' as number | '', receiptNumber: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      editing
        ? { planId: editing.planId ?? '', purchaseDate: editing.purchaseDate, startDate: editing.startDate, durationDays: editing.durationDays, receiptNumber: editing.receiptNumber ?? '' }
        : { planId: '', purchaseDate: todayISO(), startDate: todayISO(), durationDays: '', receiptNumber: '' },
    )
  }, [open, editing])

  const expiry = useMemo(() => (isValidISO(form.startDate) && Number(form.durationDays) > 0 ? calcExpiry(form.startDate, Number(form.durationDays)) : null), [form.startDate, form.durationDays])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const errs = await onSubmit({ ...form, membershipId: editing?.id })
    setBusy(false)
    if (errs) setErrors(errs)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit membership' : 'Record a membership'} description={editing ? 'Correct the plan or dates.' : 'Sold at the front desk — recorded as verified.'}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Select
          label="Plan"
          required
          value={form.planId}
          error={errors.planId}
          onChange={(e) => {
            const p = plans.data?.find((x) => x.id === Number(e.target.value))
            setForm((f) => ({ ...f, planId: Number(e.target.value), durationDays: p?.durationDays ?? f.durationDays }))
          }}
        >
          <option value="" disabled>Select a plan…</option>
          {plans.data?.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.durationDays} days</option>)}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Purchase date" type="date" required max={todayISO()} value={form.purchaseDate} error={errors.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
          <Input label="Start date" type="date" required value={form.startDate} error={errors.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <Input label="Duration (days)" type="number" min={1} max={730} required value={form.durationDays} error={errors.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value === '' ? '' : Number(e.target.value) }))} />
          <Input label="Receipt number" value={form.receiptNumber} error={errors.receiptNumber} onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))} />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3.5 text-white">
          <span className="text-sm text-white/65">Expiry date (auto)</span>
          <span className="font-wide font-black text-cyan-300">{expiry ? formatDate(expiry) : '—'}</span>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="dark" loading={busy}>{editing ? 'Save changes' : 'Record membership'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function ProfileForm({ c, onSubmit }: { c: AdminCustomer; onSubmit: (p: Record<string, unknown>) => Promise<Record<string, string> | null> }) {
  const init = () => ({
    name: c.name, email: c.email, phone: c.phone?.replace(/^\+91/, '') ?? '', dateOfBirth: c.dateOfBirth ?? '', gender: (c.gender ?? '') as Gender | '',
    address: c.address ?? '', notes: c.notes ?? '', isActive: c.isActive, emailOptIn: c.emailOptIn, whatsappOptIn: c.whatsappOptIn,
  })
  const [form, setForm] = useState(init)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(init()), [c])
  const set = <K extends keyof ReturnType<typeof init>>(k: K, v: ReturnType<typeof init>[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const errs = await onSubmit(form)
    setBusy(false)
    setErrors(errs ?? {})
  }

  return (
    <form onSubmit={submit} noValidate className="card p-5 sm:p-6">
      <h2 className="font-wide text-lg font-extrabold uppercase">Customer information</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Input label="Full name" value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
        <Input label="Email" type="email" value={form.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
        <Input label="Phone" type="tel" value={form.phone} error={errors.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Date of birth" type="date" value={form.dateOfBirth} error={errors.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        <Select label="Gender" value={form.gender} error={errors.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
          <option value="" disabled>Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not">Prefer not to say</option>
        </Select>
        <Textarea className="sm:col-span-2 xl:col-span-1 2xl:col-span-2" label="Address" rows={2} value={form.address} error={errors.address} onChange={(e) => set('address', e.target.value)} />
        <Textarea className="sm:col-span-2 xl:col-span-1 2xl:col-span-2" label="Staff notes (private)" rows={2} value={form.notes} error={errors.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Injuries, preferred trainer, payment notes…" />
      </div>
      <div className="mt-5 grid gap-4 border-t border-line pt-5">
        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Account active" description="Inactive accounts can’t sign in and get no reminders." />
        <Toggle checked={form.emailOptIn} onChange={(v) => set('emailOptIn', v)} label="Email reminders" />
        <Toggle checked={form.whatsappOptIn} onChange={(v) => set('whatsappOptIn', v)} label="WhatsApp reminders" />
      </div>
      <Button type="submit" variant="dark" block className="mt-6" loading={busy}>Save customer</Button>
    </form>
  )
}

function ResetPassword({ onSubmit }: { onSubmit: (password: string) => Promise<Record<string, string> | null> }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const errs = await onSubmit(password)
    setBusy(false)
    setError(errs?.password ?? '')
    if (!errs) setPassword('')
  }
  return (
    <form onSubmit={submit} noValidate className="card p-5 sm:p-6">
      <h2 className="font-wide flex items-center gap-2 text-lg font-extrabold uppercase"><KeyRound className="size-4 text-cyan-600" />Reset password</h2>
      <p className="mt-1 text-[13px] text-muted">For members who forgot theirs. Set a temporary password and give it to them in person.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <Input className="flex-1" label="Temporary password" type="text" autoComplete="off" value={password} error={error} onChange={(e) => setPassword(e.target.value)} hint="8+ characters with letters and a number." />
        <Button type="submit" variant="outline" className="sm:mt-[26px]" loading={busy}>Set</Button>
      </div>
    </form>
  )
}

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { data, error, loading, reload, setData } = useLoad(() => api.adminCustomer(Number(id)).then((r) => r.data), [id])
  const [modal, setModal] = useState<{ open: boolean; editing: Membership | null }>({ open: false, editing: null })
  usePageTitle(data?.customer.name ?? 'Customer')

  async function act(action: CustomerAction, payload: Record<string, unknown>): Promise<Record<string, string> | null> {
    try {
      const r = await api.adminCustomerAction(Number(id), action, payload)
      setData(r.data as CustomerDetail)
      toast.success(r.message)
      return null
    } catch (e) {
      toast.error('Couldn’t save', errorMessage(e))
      return fieldErrors(e)
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading && !data) return <PageLoader />
  if (!data) return null
  const c = data.customer
  const m = c.membership

  return (
    <>
      <Link to="/admin/customers" className="inline-flex animate-fade-up items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Customers
      </Link>

      <header className="mt-4 mb-7 flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={c.name} size="lg" />
          <div className="min-w-0">
            <h1 className="font-wide truncate text-2xl font-black uppercase sm:text-3xl">{c.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
              <StatusBadge status={m?.status ?? 'none'} />
              {!c.isActive && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-semibold text-red-700 ring-1 ring-red-200">Inactive</span>}
              <span>Member since {formatDate(c.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && <Button href={waHref(c.phone, `Hi ${c.name.split(' ')[0]}, this is Apex Fitness.`)} target="_blank" variant="outline" size="sm" icon={<MessageCircle className="size-4 text-emerald-600" />}>WhatsApp</Button>}
          {c.phone && <Button href={telHref(c.phone)} variant="outline" size="sm" icon={<Phone className="size-4" />}>{formatPhone(c.phone)}</Button>}
          <Button href={`mailto:${c.email}`} variant="outline" size="sm" icon={<Mail className="size-4" />}>Email</Button>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          {/* Current membership */}
          <section className="card-dark relative animate-fade-up overflow-hidden p-6">
            <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">Current membership</p>
                  <p className="font-wide mt-1 text-3xl font-black uppercase">{m?.planName ?? 'None'}</p>
                </div>
                <Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={() => setModal({ open: true, editing: null })}>
                  Record membership
                </Button>
              </div>
              {m ? (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['Start', formatDate(m.startDate)],
                      ['Expiry', formatDate(m.expiryDate)],
                      ['Days left', m.status === 'expired' ? '0' : String(m.daysRemaining)],
                      ['Duration', `${m.durationDays} days`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
                        <p className="text-[11.5px] text-white/50">{k}</p>
                        <p className="font-wide mt-0.5 text-lg font-black">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <VerificationBadge status={m.verificationStatus} dark />
                    {m.receiptNumber && <span className="text-[12.5px] text-white/50">Receipt {m.receiptNumber}</span>}
                    {m.verificationStatus === 'pending' && (
                      <div className="ml-auto flex gap-2">
                        <Button size="sm" variant="primary" icon={<Check className="size-4" />} onClick={() => act('verify_membership', { membershipId: m.id, status: 'verified' })}>Verify</Button>
                        <Button size="sm" variant="light" icon={<X className="size-4" />} onClick={() => act('verify_membership', { membershipId: m.id, status: 'rejected' })}>Reject</Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-white/60">This customer hasn’t linked a membership. Record one sold at the desk.</p>
              )}
            </div>
          </section>

          {/* History */}
          <section className="card animate-fade-up overflow-hidden [animation-delay:60ms]">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-wide text-lg font-extrabold uppercase">Membership history</h2>
            </div>
            <ul className="divide-y divide-line">
              {data.memberships.length ? (
                data.memberships.map((ms) => (
                  <li key={ms.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        {ms.planName}
                        <StatusBadge status={ms.status} />
                        <VerificationBadge status={ms.verificationStatus} short />
                      </p>
                      <p className="mt-1 text-[13px] text-muted">
                        {formatDate(ms.startDate)} → {formatDate(ms.expiryDate)} · {ms.durationDays} days · bought {formatDate(ms.purchaseDate)} · added by {ms.source === 'admin' ? 'staff' : 'member'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {ms.verificationStatus !== 'verified' && (
                        <button onClick={() => act('verify_membership', { membershipId: ms.id, status: 'verified' })} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-50">Verify</button>
                      )}
                      <button onClick={() => setModal({ open: true, editing: ms })} className="grid size-8 place-items-center rounded-full text-ink/55 hover:bg-canvas hover:text-ink" aria-label="Edit membership"><Pencil className="size-4" /></button>
                      <button
                        onClick={() => window.confirm(`Remove the ${ms.planName} membership starting ${formatDate(ms.startDate)}?`) && act('cancel_membership', { membershipId: ms.id })}
                        className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50"
                        aria-label="Remove membership"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-6 py-10 text-center text-sm text-muted">No memberships recorded.</li>
              )}
            </ul>
          </section>

          {/* Notifications */}
          <section className="card animate-fade-up overflow-hidden [animation-delay:120ms]">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-wide text-lg font-extrabold uppercase">Notification history</h2>
            </div>
            <ul className="divide-y divide-line">
              {data.notifications.length ? (
                data.notifications.map((n) => {
                  const Icon = CHANNEL_ICON[n.channel]
                  return (
                    <li key={n.id} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-canvas ring-1 ring-line"><Icon className="size-4 text-cyan-700" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{n.title}</p>
                        <p className="text-[12.5px] text-muted capitalize">{n.channel} · {formatDateTime(n.createdAt)}</p>
                        {n.error && <p className="mt-0.5 text-[12px] text-red-600">{n.error}</p>}
                      </div>
                      <DeliveryBadge status={n.status} />
                    </li>
                  )
                })
              ) : (
                <li className="px-6 py-10 text-center text-sm text-muted">No notifications yet.</li>
              )}
            </ul>
          </section>
        </div>

        <div className="grid animate-fade-up gap-6 [animation-delay:80ms]">
          <ProfileForm c={c} onSubmit={(p) => act('update_profile', p)} />
          <ResetPassword onSubmit={(password) => act('set_password', { password })} />
        </div>
      </div>

      <MembershipModal
        open={modal.open}
        editing={modal.editing}
        onClose={() => setModal({ open: false, editing: null })}
        onSubmit={async (payload) => {
          const errs = await act(modal.editing ? 'update_membership' : 'add_membership', payload)
          if (!errs) setModal({ open: false, editing: null })
          return errs
        }}
      />
    </>
  )
}
