import { BadgeCheck, Layers, Pencil, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AdminHeader } from '../../components/admin/Parts'
import { Button } from '../../components/ui/Button'
import { Input, Textarea, Toggle } from '../../components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Misc'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { inr } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'
import type { Plan } from '../../types'

const BLANK = { name: '', durationDays: 30 as number | '', price: '' as number | string, tagline: '', features: '', isFeatured: false, isActive: true, sortOrder: 10 as number | '' }

function PlanModal({ plan, open, onClose, onSaved }: { plan: Plan | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      plan
        ? { name: plan.name, durationDays: plan.durationDays, price: plan.price ?? '', tagline: plan.tagline ?? '', features: plan.features.join('\n'), isFeatured: plan.isFeatured, isActive: plan.isActive, sortOrder: plan.sortOrder }
        : BLANK,
    )
  }, [open, plan])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.adminSavePlan({
        id: plan?.id,
        name: form.name,
        durationDays: Number(form.durationDays),
        price: form.price === '' ? null : Number(form.price),
        tagline: form.tagline,
        features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      })
      toast.success('Plan saved')
      onSaved()
      onClose()
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error('Couldn’t save plan', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={plan ? `Edit ${plan.name}` : 'New plan'} description="Plans are informational — members pay at the front desk.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Plan name" required value={form.name} error={errors.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Duration (days)" type="number" required min={1} max={730} value={form.durationDays} error={errors.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value === '' ? '' : Number(e.target.value) }))} />
          <Input label="Price (₹)" type="number" min={0} value={form.price} error={errors.price} hint="Leave empty to show “Ask at the desk”." onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <Input label="Display order" type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value === '' ? '' : Number(e.target.value) }))} />
        </div>
        <Input label="Tagline" value={form.tagline} error={errors.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        <Textarea label="Features (one per line)" rows={4} value={form.features} error={errors.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} />
        <div className="grid gap-4 rounded-2xl bg-canvas p-4 ring-1 ring-line">
          <Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Visible on website" description="Hidden plans stay on existing memberships." />
          <Toggle checked={form.isFeatured} onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} label="Highlight as “Most popular”" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="dark" loading={busy}>Save plan</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminPlans() {
  usePageTitle('Membership plans')
  const { data, error, loading, reload } = useLoad(() => api.adminPlans().then((r) => r.data.plans), [])
  const [modal, setModal] = useState<{ open: boolean; plan: Plan | null }>({ open: false, plan: null })

  return (
    <>
      <AdminHeader title="Membership plans" text="What members see on the website and choose when linking a membership. No online payment — prices are for information." actions={<Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setModal({ open: true, plan: null })}>New plan</Button>} />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : !data?.length ? (
        <div className="card"><EmptyState icon={<Layers />} title="No plans yet" text="Create your first membership plan." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((p, i) => (
            <article key={p.id} style={{ animationDelay: `${i * 60}ms` }} className={`relative flex animate-fade-up flex-col rounded-3xl p-6 ${p.isFeatured ? 'bg-ink text-white shadow-glow' : 'card'} ${p.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-wide text-xl font-black uppercase">{p.name}</h2>
                  <p className={`font-mono text-[12px] ${p.isFeatured ? 'text-cyan-300' : 'text-cyan-700'}`}>{p.durationDays} days</p>
                </div>
                <button onClick={() => setModal({ open: true, plan: p })} className={`grid size-9 place-items-center rounded-full ${p.isFeatured ? 'bg-white/10 hover:bg-white/20' : 'bg-canvas ring-1 ring-line hover:ring-ink/20'}`} aria-label={`Edit ${p.name}`}>
                  <Pencil className="size-4" />
                </button>
              </div>
              <p className="font-wide mt-5 text-3xl font-black">{p.price !== null ? inr(p.price) : '—'}</p>
              <p className={`mt-1 text-[13px] ${p.isFeatured ? 'text-white/55' : 'text-muted'}`}>{p.tagline}</p>
              <ul className={`mt-4 mb-5 grid gap-1.5 text-[13px] ${p.isFeatured ? 'text-white/75' : 'text-ink/70'}`}>
                {p.features.map((f) => <li key={f}>· {f}</li>)}
              </ul>
              <div className={`mt-auto flex flex-wrap items-center gap-2 border-t pt-4 text-[12px] font-semibold ${p.isFeatured ? 'border-white/10' : 'border-line'}`}>
                <span className={`rounded-full px-2.5 py-1 ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-ink/10 text-ink/60'}`}>{p.isActive ? 'Visible' : 'Hidden'}</span>
                {p.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400 px-2.5 py-1 text-ink"><BadgeCheck className="size-3.5" />Featured</span>}
                <span className={`ml-auto ${p.isFeatured ? 'text-white/50' : 'text-muted'}`}>{p.memberships ?? 0} memberships</span>
              </div>
            </article>
          ))}
        </div>
      )}
      <PlanModal open={modal.open} plan={modal.plan} onClose={() => setModal({ open: false, plan: null })} onSaved={reload} />
    </>
  )
}
