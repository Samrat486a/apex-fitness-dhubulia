import { ChevronDown, Clock, Dumbbell, HeartPulse, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CtaBanner } from '../components/home/CtaBanner'
import { MapEmbed } from '../components/home/Location'
import { Facilities } from '../components/home/Facilities'
import { HowItWorks } from '../components/home/HowItWorks'
import { PlansSection } from '../components/home/Plans'
import { Programs } from '../components/home/Programs'
import { Stats } from '../components/home/Stats'
import { Testimonials } from '../components/home/Testimonials'
import { Trainers } from '../components/home/Trainers'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Field'
import { FAQ, IMAGES } from '../config/site'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, errorMessage, fieldErrors } from '../lib/api'
import { usePageTitle, useReveal } from '../lib/hooks'
import { directionsUrl } from '../lib/maps'
import { telHref, useGym, waHref } from '../lib/useGym'

export function ProgramsPage() {
  usePageTitle('Programs')
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref}>
      <PageHeader crumb="Programs" eyebrow="Train with purpose" title="Programs built" accent="for results." text="Strength, conditioning, mobility and 1-on-1 coaching. Every program is included with your membership — open any program to see how it works, then tell the front desk which one you want to start." />
      <Programs showAll={false} />
      <Trainers />
      <Facilities />
      <CtaBanner />
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-6 py-5 text-left" aria-expanded={open}>
        <span className="text-[16px] font-bold">{q}</span>
        <span className={`grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-500 ${open ? 'rotate-180 border-cyan-500 bg-cyan-400 text-ink' : 'border-line bg-white'}`}>
          <ChevronDown className="size-4" />
        </span>
      </button>
      <div className={`grid transition-all duration-500 ${open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <p className="overflow-hidden text-[15px] leading-relaxed text-muted">{a}</p>
      </div>
    </div>
  )
}

export function MembershipPage() {
  usePageTitle('Membership')
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref}>
      <PageHeader crumb="Membership" eyebrow="Membership" title="Commit to" accent="your strongest year." text="Pick a plan and join at the front desk. Then link it online to see your days remaining and get reminders before it runs out.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button to="/contact?topic=membership" variant="primary" size="lg" arrow>Join Apex Fitness</Button>
          <Button to="/register" variant="outline" size="lg">I’m already a member</Button>
        </div>
      </PageHeader>
      <PlansSection eyebrow="Subscription plans" />
      <HowItWorks />
      <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div className="reveal">
          <p className="eyebrow">Questions</p>
          <h2 className="font-wide mt-4 text-4xl leading-none font-black uppercase sm:text-5xl">
            Good to <span className="text-apex">know.</span>
          </h2>
          <p className="mt-4 text-muted">Can’t find your answer? Call or WhatsApp the front desk — we reply fast.</p>
          <Button to="/contact" variant="dark" className="mt-6" arrow>Contact us</Button>
        </div>
        <div className="reveal card px-6 sm:px-8">
          {FAQ.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
      </section>
      <CtaBanner />
    </div>
  )
}

const VALUES = [
  { icon: Dumbbell, title: 'Coaching first', text: 'Every member gets a fitness assessment and a plan, with form corrected on the floor every day.' },
  { icon: Users, title: 'Community, not crowds', text: 'A friendly, focused floor where beginners and athletes train side by side — and everyone gets space.' },
  { icon: ShieldCheck, title: 'Honest & transparent', text: 'Clear plans, paid in person. Your dates, days remaining and reminders are always visible in your dashboard.' },
]

export function AboutPage() {
  usePageTitle('About')
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref}>
      <PageHeader crumb="About" eyebrow="Our story" title="Dhubulia’s home of" accent="serious training." text="Apex Fitness was built for people who want more than a room full of machines — a place where strength is coached, progress is measured and everyone is pushed to their peak." />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal relative overflow-hidden rounded-[36px] bg-ink">
          <img src={IMAGES.about} alt="The Apex Fitness strength floor" className="aspect-[16/9] w-full object-cover opacity-85 sm:aspect-[21/9]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <p className="font-wide absolute bottom-6 left-6 max-w-lg text-2xl leading-tight font-black text-white uppercase sm:bottom-10 sm:left-10 sm:text-4xl">
            Reach your <span className="text-cyan-300">apex.</span>
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <div key={v.title} style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties} className="reveal card p-7 transition hover:-translate-y-1 hover:shadow-lift">
              <span className="grid size-12 place-items-center rounded-2xl bg-ink text-cyan-300">
                <v.icon className="size-5" />
              </span>
              <h3 className="font-wide mt-6 text-xl font-extrabold uppercase">{v.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <Stats />
      <Facilities />
      <Testimonials />
      <CtaBanner />
    </div>
  )
}

const EMPTY = { name: '', email: '', phone: '', topic: 'general', message: '' }

export function ContactPage() {
  usePageTitle('Contact')
  const ref = useReveal<HTMLDivElement>()
  const gym = useGym()
  const toast = useToast()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const topicParam = params.get('topic') ?? ''
  const [form, setForm] = useState({
    ...EMPTY,
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone?.replace(/^\+91/, '') ?? '',
    topic: ['membership', 'personal_training', 'visit', 'general'].includes(topicParam) ? topicParam : 'general',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // The session may resolve after the first render — fill in the member's details if still empty.
  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: f.name || user.name,
      email: f.email || user.email,
      phone: f.phone || (user.phone?.replace(/^\+91/, '') ?? ''),
    }))
  }, [user])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const r = await api.contact(form)
      toast.success('Message sent', r.message)
      setSent(true)
      setForm((f) => ({ ...f, message: '' }))
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error('Couldn’t send your message', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const cards = [
    { icon: MapPin, title: 'Visit us', lines: [gym.address], action: { label: 'Get directions', href: directionsUrl(gym) } },
    { icon: Clock, title: 'Opening hours', lines: [`Mon–Sat · ${gym.hoursWeekdays}`, `Sunday · ${gym.hoursWeekends}`], action: null },
    { icon: Phone, title: 'Call the front desk', lines: [gym.phone || '—'], action: gym.phone ? { label: 'Call now', href: telHref(gym.phone) } : null },
    { icon: MessageCircle, title: 'WhatsApp', lines: [gym.whatsapp || '—'], action: gym.whatsapp ? { label: 'Start chat', href: waHref(gym.whatsapp, 'Hi Apex Fitness! I have a question.') } : null },
  ]

  return (
    <div ref={ref}>
      <PageHeader crumb="Contact" eyebrow="Get in touch" title="Come train" accent="with us." text="Book a free trial, ask about plans or personal training. Memberships are purchased at the front desk — we’ll help you pick the right one." />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:px-8">
        <div className="reveal card p-6 sm:p-9">
          {sent ? (
            <div className="flex flex-col items-start gap-4 py-8">
              <span className="grid size-14 place-items-center rounded-2xl bg-cyan-400 text-ink">
                <Send className="size-6" />
              </span>
              <h2 className="font-wide text-3xl font-black uppercase">Message received.</h2>
              <p className="max-w-md text-muted">Thanks, {form.name.split(' ')[0] || 'there'}! Our team will get back to you within one working day. For anything urgent, call or WhatsApp the front desk.</p>
              <Button variant="outline" onClick={() => setSent(false)}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h2 className="font-wide text-2xl font-black uppercase">Send a message</h2>
                <p className="mt-1 text-sm text-muted">We usually reply the same day.</p>
              </div>
              <Input label="Full name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
              <Input label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              <Input label="Phone (optional)" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="98XXX XXXXX" autoComplete="tel" />
              <Select label="Topic" value={form.topic} onChange={set('topic')}>
                <option value="general">General question</option>
                <option value="membership">Membership & plans</option>
                <option value="visit">Visit / free trial</option>
                <option value="personal_training">Personal training</option>
              </Select>
              <Textarea className="sm:col-span-2" label="Message" required value={form.message} onChange={set('message')} error={errors.message} placeholder="Tell us about your goals or question…" />
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted">We never share your details.</p>
                <Button type="submit" variant="primary" size="lg" loading={busy} arrow>Send message</Button>
              </div>
            </form>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {cards.map((c, i) => (
            <div key={c.title} style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties} className="reveal card flex items-start gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-cyan-300">
                <c.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{c.title}</p>
                {c.lines.map((l) => (
                  <p key={l} className="text-sm break-words text-muted">{l}</p>
                ))}
                {c.action && (
                  <a href={c.action.href} target={c.action.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-bold text-cyan-700 hover:text-cyan-600">
                    {c.action.label} →
                  </a>
                )}
              </div>
            </div>
          ))}
          {gym.email && (
            <a href={`mailto:${gym.email}`} className="reveal inline-flex items-center gap-2 px-1 text-sm font-semibold text-muted hover:text-ink">
              <Mail className="size-4" /> {gym.email}
            </a>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="reveal overflow-hidden rounded-[32px] border border-line bg-white shadow-card">
          <MapEmbed gym={gym} className="h-[360px] sm:h-[420px]" />
        </div>
      </section>
    </div>
  )
}

export function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <span className="grid size-16 place-items-center rounded-3xl bg-ink text-cyan-300">
        <HeartPulse className="size-7" />
      </span>
      <p className="font-wide text-outline mt-8 text-[120px] leading-none font-black text-ink/30 sm:text-[160px]">404</p>
      <h1 className="font-wide mt-2 text-3xl font-black uppercase">Missed that rep.</h1>
      <p className="mt-3 max-w-md text-muted">The page you’re looking for has moved or never existed. Let’s get you back to training.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button to="/" variant="dark" arrow>Back to home</Button>
        <Button to="/membership" variant="outline">View membership</Button>
      </div>
    </section>
  )
}
