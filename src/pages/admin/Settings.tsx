import { Bell, Building2, Mail, MessageCircle, Server } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AdminHeader } from '../../components/admin/Parts'
import { Button } from '../../components/ui/Button'
import { Input, Toggle } from '../../components/ui/Field'
import { ErrorState, PageLoader } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { useLoad, usePageTitle } from '../../lib/hooks'
import { invalidateGym } from '../../lib/useGym'
import type { AdminSettings } from '../../types'

export default function AdminSettingsPage() {
  usePageTitle('Settings')
  const toast = useToast()
  const { data, error, loading, reload, setData } = useLoad(() => api.adminSettings().then((r) => r.data), [])
  const [form, setForm] = useState<AdminSettings | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) setForm(data.settings)
  }, [data])

  if (error) return <ErrorState message={error} onRetry={reload} />
  if ((loading && !data) || !form || !data) return <PageLoader />

  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const text = (k: keyof AdminSettings, label: string, extra: Record<string, unknown> = {}) => (
    <Input label={label} value={String(form[k])} error={errors[k]} onChange={(e) => set(k, e.target.value as never)} {...extra} />
  )

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const r = await api.adminSaveSettings(form!)
      setData(r.data)
      invalidateGym()
      toast.success('Settings saved')
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error('Couldn’t save settings', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const driverLabel = (d: string) => (d === 'log' ? 'Log only (development)' : d === 'smtp' ? 'SMTP' : d === 'cloud_api' ? 'WhatsApp Cloud API' : d === 'mail' ? 'PHP mail()' : 'Demo (simulated)')

  return (
    <form onSubmit={save} noValidate>
      <AdminHeader title="Settings" text="Gym details shown on the website and dashboards, and how membership reminders are sent." actions={<Button type="submit" variant="dark" loading={busy}>Save settings</Button>} />
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card animate-fade-up p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ink text-cyan-300"><Building2 className="size-[18px]" /></span>
            <h2 className="font-wide text-lg font-extrabold uppercase">Gym information</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {text('gym_name', 'Gym name')}
            {text('gym_tagline', 'Tagline')}
            <div className="sm:col-span-2">{text('gym_address', 'Address')}</div>
            {text('gym_phone', 'Phone')}
            {text('gym_whatsapp', 'WhatsApp number')}
            {text('gym_email', 'Email', { type: 'email' })}
            {text('gym_map_url', 'Google Maps link', { placeholder: 'https://maps.google.com/…' })}
            <div className="sm:col-span-2">
              {text('gym_map_query', 'Map location (embedded map)', {
                placeholder: 'e.g. Apex Fitness, Dhubulia  —  or  23.4996, 88.4426',
                hint: 'What the map on the website shows. Use the gym’s name as it appears on Google Maps, or its exact coordinates (Google Maps → right-click the gym → copy the numbers). Empty = the address above.',
              })}
            </div>
            {text('gym_hours_weekdays', 'Hours · Mon–Sat')}
            {text('gym_hours_weekends', 'Hours · Sunday')}
          </div>
        </section>

        <div className="grid gap-6">
          <section className="card animate-fade-up p-6 [animation-delay:60ms] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-400 text-ink"><Bell className="size-[18px]" /></span>
              <h2 className="font-wide text-lg font-extrabold uppercase">Reminders</h2>
            </div>
            <div className="mt-6 grid gap-5">
              <Toggle checked={form.reminders_dashboard} onChange={(v) => set('reminders_dashboard', v)} label="Dashboard notifications" />
              <Toggle checked={form.reminders_email} onChange={(v) => set('reminders_email', v)} label="Email reminders" />
              <Toggle checked={form.reminders_whatsapp} onChange={(v) => set('reminders_whatsapp', v)} label="WhatsApp reminders" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6">
              <Input label="First reminder (days left)" type="number" min={1} max={30} value={form.reminder_first_days} error={errors.reminder_first_days} onChange={(e) => set('reminder_first_days', Number(e.target.value))} />
              <Input label="Second reminder (days left)" type="number" min={1} max={30} value={form.reminder_second_days} error={errors.reminder_second_days} onChange={(e) => set('reminder_second_days', Number(e.target.value))} />
            </div>
            <p className="mt-4 text-[12.5px] text-muted">Each reminder is sent once per membership and channel. Last run: {data.remindersLastRun ? formatDateTime(data.remindersLastRun) : 'never'}.</p>
          </section>

          <section className="card-dark animate-fade-up p-6 [animation-delay:120ms]">
            <div className="flex items-center gap-3">
              <Server className="size-[18px] text-cyan-300" />
              <h2 className="font-wide text-base font-extrabold uppercase">Delivery providers</h2>
            </div>
            <div className="mt-4 grid gap-2.5 text-sm">
              <p className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10"><span className="flex items-center gap-2 text-white/70"><Mail className="size-4" />Email</span><b>{driverLabel(data.channels.emailDriver)}</b></p>
              <p className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10"><span className="flex items-center gap-2 text-white/70"><MessageCircle className="size-4" />WhatsApp</span><b>{driverLabel(data.channels.whatsappDriver)}</b></p>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-white/50">Providers and credentials are configured on the server in <code className="text-cyan-300">app/config/config.php</code> — never stored in the database.</p>
          </section>
        </div>
      </div>
    </form>
  )
}
