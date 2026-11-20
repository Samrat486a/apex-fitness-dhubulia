/*
 * Demo backend that lives in the browser (VITE_API_MODE=mock).
 *
 * It mirrors the PHP API — same responses, validation messages, membership rules and
 * duplicate-proof reminder logic — so the whole site can be previewed without PHP/MySQL.
 * Data is kept in localStorage; "email" and "WhatsApp" deliveries are simulated.
 * Live builds never include this file (see backend() in api.ts).
 */
import type {
  AdminCustomer,
  AdminSettings,
  AppNotification,
  Channel,
  ContactMessage,
  DeliveryStatus,
  ExpiringData,
  Gender,
  GymInfo,
  Membership,
  NotificationType,
  OnboardingStatus,
  Plan,
  ReminderSummary,
  Role,
  User,
  VerificationStatus,
} from '../types'
import { ApiError, type Api, type Query, type Result } from './api'
import { addDays, calcExpiry, daysBetween, isValidISO, membershipState, todayISO } from './membership'

const DB_KEY = 'apex_demo_db_v3'
const SESSION_KEY = 'apex_demo_session'

interface DbUser extends Omit<User, 'createdAt'> {
  password: string
  isActive: boolean
  notes: string | null
  lastLoginAt: string | null
  createdAt: string
}
interface DbMembership {
  id: number
  userId: number
  planId: number | null
  planName: string
  purchaseDate: string
  startDate: string
  durationDays: number
  expiryDate: string
  verificationStatus: VerificationStatus
  source: 'member' | 'admin'
  receiptNumber: string | null
  isCancelled: boolean
  createdAt: string
}
interface DbNotification {
  id: number
  userId: number
  membershipId: number | null
  type: NotificationType
  channel: Channel
  status: DeliveryStatus
  title: string
  message: string
  recipient: string | null
  attempts: number
  error: string | null
  readAt: string | null
  sentAt: string | null
  createdAt: string
}
interface Db {
  seq: number
  users: DbUser[]
  plans: Plan[]
  memberships: DbMembership[]
  notifications: DbNotification[]
  messages: ContactMessage[]
  settings: Record<string, string>
}

/* ── storage ─────────────────────────────────────────────── */

let cache: Db | null = null

function load(): Db {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) cache = JSON.parse(raw) as Db
  } catch {
    cache = null
  }
  if (!cache) {
    cache = seed()
    save()
  }
  return cache
}

function save() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache))
  } catch {
    /* private mode — keep working in memory */
  }
}

function sessionUserId(): number | null {
  try {
    const v = Number(localStorage.getItem(SESSION_KEY))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

function setSession(id: number | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, String(id))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

const nextId = () => ++load().seq
const now = () => {
  const d = new Date()
  return `${todayISO()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
const daysAgoStamp = (n: number, time = '09:00:00') => `${addDays(todayISO(), -n)} ${time}`
const wait = () => new Promise((r) => setTimeout(r, 180 + Math.random() * 220))

async function ok<T>(data: T, message = 'OK'): Promise<Result<T>> {
  await wait()
  save()
  return { message, data: structuredClone(data) }
}

function fail(message: string, status: number, code: string, errors: Record<string, string> = {}): never {
  throw new ApiError(message, status, code, errors)
}

/* ── seed ────────────────────────────────────────────────── */

const DEFAULT_SETTINGS: Record<string, string> = {
  gym_name: 'Apex Fitness',
  gym_tagline: 'Train Strong. Live Stronger.',
  gym_address: 'Saratpally, Dhubulia, Dwipchandrapur, Nadia, West Bengal 741139',
  gym_phone: '+91 86170 96552',
  gym_whatsapp: '+91 93822 66803',
  gym_email: 'hello@apexfitness.example',
  gym_hours_weekdays: '5:00 AM – 10:00 PM',
  gym_hours_weekends: '6:00 AM – 8:00 PM',
  gym_map_url: 'https://www.google.com/maps/place/Apex+Fitness/@23.4881324,88.4374046,18z/data=!4m6!3m5!1s0x39f919488fe53249:0xfa7af03e705a74d2!8m2!3d23.4881324!4d88.4374046!16s%2Fg%2F11zynl4_0b',
  gym_map_query: 'Apex Fitness, Dhubulia',
  reminders_email: '1',
  reminders_whatsapp: '1',
  reminders_dashboard: '1',
  reminder_first_days: '5',
  reminder_second_days: '3',
}

function seedPlans(): Plan[] {
  const p = (id: number, slug: string, name: string, durationDays: number, price: number, tagline: string, features: string[], isFeatured = false): Plan => ({
    id, slug, name, durationDays, price, tagline, features, isFeatured, isActive: true, sortOrder: id,
  })
  return [
    p(1, 'monthly', 'Monthly', 30, 1200, 'Start strong, no long commitment.', ['Full gym floor access', 'Cardio & strength zones', 'Locker room access', 'Free fitness assessment']),
    p(2, 'quarterly', 'Quarterly', 90, 3200, 'Our most popular way to build a habit.', ['Everything in Monthly', 'Personal workout plan', 'Monthly progress check-in', 'Group class access'], true),
    p(3, 'half-yearly', 'Half-Yearly', 180, 5800, 'Six months to transform your training.', ['Everything in Quarterly', '2 personal training sessions', 'Nutrition guidance session', 'Priority class booking']),
    p(4, 'yearly', 'Yearly', 365, 9999, 'Best value for committed athletes.', ['Everything in Half-Yearly', '6 personal training sessions', 'Quarterly body composition scan', 'Freeze up to 30 days']),
  ]
}

function seed(): Db {
  const db: Db = { seq: 100, users: [], plans: seedPlans(), memberships: [], notifications: [], messages: [], settings: { ...DEFAULT_SETTINGS } }
  cache = db
  const t = todayISO()
  let uid = 1
  let mid = 1

  const user = (name: string, email: string, phone: string | null, gender: Gender, joinedDaysAgo: number, extra: Partial<DbUser> = {}): DbUser => {
    const u: DbUser = {
      id: uid++, name, email, phone, role: 'member', dateOfBirth: addDays(t, -(9000 + uid * 211)), gender,
      address: 'Dhubulia, Nadia, West Bengal 741139', onboardingStatus: 'member', emailOptIn: true, whatsappOptIn: true,
      password: 'ApexMember2026', isActive: true, notes: null, lastLoginAt: null, createdAt: daysAgoStamp(joinedDaysAgo, '10:15:00'),
      ...extra,
    }
    db.users.push(u)
    return u
  }
  const membership = (u: DbUser, planId: number, startOffset: number, verification: VerificationStatus = 'verified', source: 'member' | 'admin' = 'member') => {
    const plan = db.plans.find((p) => p.id === planId)!
    const start = addDays(t, startOffset)
    db.memberships.push({
      id: mid++, userId: u.id, planId, planName: plan.name, purchaseDate: addDays(start, -1), startDate: start,
      durationDays: plan.durationDays, expiryDate: calcExpiry(start, plan.durationDays), verificationStatus: verification,
      source, receiptNumber: `APX-${String(1040 + mid).padStart(5, '0')}`, isCancelled: false, createdAt: `${start} 08:30:00`,
    })
  }

  user('Apex Admin', 'admin@apexfitness.demo', '+919800000001', 'prefer_not', 120, { role: 'admin' as Role, password: 'ApexAdmin2026', onboardingStatus: 'not_member' })

  const demo = user('Arjun Das', 'member@apexfitness.demo', '+919800000002', 'male', 90)
  membership(demo, 1, -120)            // an older monthly, long expired (history)
  membership(demo, 2, -87)             // quarterly → 3 days left

  // Members at every stage, relative to today, so the admin views have something to show.
  const roster: [string, string, Gender, number, number, VerificationStatus?][] = [
    ['Priya Sarkar', '+919830011223', 'female', 4, -85],      // 5 days left
    ['Sourav Ghosh', '+919830022334', 'male', 1, -25],        // 5 days left
    ['Ananya Biswas', '+919830033445', 'female', 2, -86],     // 4 days left
    ['Rahul Mondal', '+919830044513', 'male', 1, -27],        // 3 days left (WhatsApp fails in demo)
    ['Moumita Paul', '+919830055667', 'female', 1, -29],      // 1 day left
    ['Debjit Saha', '+919830066778', 'male', 2, -92],         // expired 2 days ago
    ['Sneha Roy', '+919830077889', 'female', 1, -31],         // expired yesterday
    ['Abhishek Pramanik', '+919830088990', 'male', 3, -200],  // expired 20 days ago
    ['Tanushree Dey', '+919830099001', 'female', 4, -120, 'pending'],
    ['Rakib Sheikh', '+919831011122', 'male', 3, -40],
    ['Puja Halder', '+919831022233', 'female', 2, -10, 'pending'],
    ['Subhajit Mitra', '+919831033344', 'male', 4, -300],
    ['Ishita Banerjee', '+919831044455', 'female', 1, 3, 'pending'], // starts in 3 days
    ['Kunal Basak', '+919831055566', 'male', 2, -60],
  ]
  roster.forEach(([name, phone, gender, planId, start, verification], i) => {
    const email = name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com'
    const u = user(name, email, phone, gender, Math.max(2, -start + 2 + (i % 4)))
    membership(u, planId, start, verification ?? 'verified', i % 3 === 0 ? 'admin' : 'member')
  })
  user('Nilanjana Sen', 'nilanjana.sen@example.com', '+919831066677', 'female', 1, { onboardingStatus: 'not_member', address: null })

  // History: first reminders that went out on earlier days (the job runs daily).
  const sentEarlier = (email: string, daysAgo: number) => {
    const u = db.users.find((x) => x.email === email)!
    const m = currentOf(u.id)!
    const days = daysBetween(addDays(t, -daysAgo), m.expiryDate)
    const copy = reminderCopy('reminder_first', u.name, days, m.expiryDate)
    for (const channel of ['dashboard', 'email', 'whatsapp'] as Channel[]) {
      const failed = channel === 'whatsapp' && (u.phone ?? '').endsWith('13')
      db.notifications.push({
        id: nextId(), userId: u.id, membershipId: m.id, type: 'reminder_first', channel, status: failed ? 'failed' : 'sent', ...copy,
        recipient: channel === 'email' ? u.email : channel === 'whatsapp' ? u.phone : null, attempts: channel === 'dashboard' ? 0 : 1,
        error: failed ? '(#131026) Message undeliverable: recipient is not a WhatsApp user' : null,
        readAt: channel === 'dashboard' ? daysAgoStamp(daysAgo, '19:12:00') : null,
        sentAt: failed ? null : daysAgoStamp(daysAgo), createdAt: daysAgoStamp(daysAgo),
      })
    }
  }
  sentEarlier('member@apexfitness.demo', 2)
  sentEarlier('rahul.mondal@example.com', 2)
  sentEarlier('moumita.paul@example.com', 4)

  db.messages.push(
    { id: nextId(), name: 'Rohit Mallick', email: 'rohit.m@example.com', phone: '+919874512300', topic: 'membership', message: 'Hi, do you offer a student discount on the quarterly plan? I can visit this weekend.', status: 'new', createdAt: daysAgoStamp(0, '08:42:00') },
    { id: nextId(), name: 'Sayani Kar', email: 'sayani.kar@example.com', phone: null, topic: 'personal_training', message: 'Looking for a female trainer for evening sessions, 3 days a week. Is that available?', status: 'new', createdAt: daysAgoStamp(1, '18:05:00') },
    { id: nextId(), name: 'Biplab Ghosh', email: 'biplab.g@example.com', phone: '+919733001122', topic: 'visit', message: 'Can I come in for a trial workout before joining?', status: 'handled', createdAt: daysAgoStamp(3, '11:30:00') },
  )

  runReminders()
  return db
}

/* ── rules (mirrors backend/app/lib) ─────────────────────── */

const setting = (k: string) => load().settings[k] ?? DEFAULT_SETTINGS[k] ?? ''
const settingInt = (k: string) => Number(setting(k)) || 0
const settingBool = (k: string) => setting(k) === '1'

function publicUser(u: DbUser): User {
  const { password: _p, isActive: _a, notes: _n, lastLoginAt: _l, ...rest } = u
  return rest
}

function publicMembership(m: DbMembership): Membership {
  const { isCancelled: _c, ...rest } = m
  return { ...rest, ...membershipState(m.startDate, m.expiryDate, m.durationDays, settingInt('reminder_first_days')) }
}

function userMemberships(userId: number): DbMembership[] {
  return load()
    .memberships.filter((m) => m.userId === userId && !m.isCancelled)
    .sort((a, b) => (b.startDate.localeCompare(a.startDate) || b.id - a.id))
}

function pickCurrent(rows: DbMembership[]): DbMembership | null {
  const t = todayISO()
  const valid = rows.filter((m) => m.verificationStatus !== 'rejected')
  const running = valid.filter((m) => m.startDate <= t && m.expiryDate > t).sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))
  if (running.length) return running[0]
  const upcoming = valid.filter((m) => m.startDate > t).sort((a, b) => a.startDate.localeCompare(b.startDate))
  if (upcoming.length) return upcoming[0]
  return [...valid].sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0] ?? null
}

const currentOf = (userId: number) => pickCurrent(userMemberships(userId))

function publicNotification(n: DbNotification, admin = false): AppNotification {
  const base: AppNotification = {
    id: n.id, type: n.type, channel: n.channel, status: n.status, title: n.title, message: n.message,
    read: n.readAt !== null, createdAt: n.createdAt, sentAt: n.sentAt,
  }
  if (!admin) return base
  const u = load().users.find((x) => x.id === n.userId)
  return { ...base, userId: n.userId, userName: u?.name ?? '—', recipient: n.recipient, membershipId: n.membershipId, attempts: n.attempts, error: n.error }
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name
const plural = (n: number) => (n === 1 ? '1 day' : `${n} days`)
const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function reminderCopy(type: NotificationType, name: string, days: number, expiry: string) {
  if (type === 'expired') {
    return { title: 'Your membership has expired', message: `Hi ${firstName(name)}, your Apex Fitness membership expired on ${fmt(expiry)}. Visit the front desk to renew and get straight back to training.` }
  }
  return {
    title: `Membership expires in ${plural(days)}`,
    message: `Hi ${firstName(name)}, your Apex Fitness membership expires in ${plural(days)} (on ${fmt(expiry)}). Renew at the front desk to keep your training streak going.`,
  }
}

function dueType(days: number): NotificationType | null {
  if (days <= 0) return days >= -7 ? 'expired' : null
  if (days <= settingInt('reminder_second_days')) return 'reminder_second'
  if (days <= settingInt('reminder_first_days')) return 'reminder_first'
  return null
}

/** INSERT IGNORE on (membershipId, type, channel). */
function notifyOnce(n: Omit<DbNotification, 'id' | 'attempts' | 'readAt' | 'sentAt' | 'createdAt'>): DbNotification | null {
  const db = load()
  if (n.membershipId !== null && db.notifications.some((x) => x.membershipId === n.membershipId && x.type === n.type && x.channel === n.channel)) {
    return null
  }
  const row: DbNotification = { ...n, id: nextId(), attempts: 0, readAt: null, sentAt: null, createdAt: now() }
  db.notifications.push(row)
  return row
}

/** Simulated delivery. Demo rule: numbers ending in 13 "aren't on WhatsApp". */
function dispatch(n: DbNotification): DeliveryStatus {
  if (n.status === 'sent' || n.status === 'skipped') return n.status
  let okay = true
  let error: string | null = null
  if (n.channel === 'whatsapp' && (n.recipient ?? '').endsWith('13')) {
    okay = false
    error = '(#131026) Message undeliverable: recipient is not a WhatsApp user'
  }
  n.attempts++
  n.status = okay ? 'sent' : 'failed'
  n.error = error
  if (okay) n.sentAt = now()
  return n.status
}

function runReminders(onlyUserId?: number): ReminderSummary {
  const db = load()
  const s: ReminderSummary = { checked: 0, created: 0, sent: 0, failed: 0, skipped: 0, retried: 0 }
  const t = todayISO()
  const first = settingInt('reminder_first_days')
  const channels: Channel[] = (['dashboard', 'email', 'whatsapp'] as Channel[]).filter((c) => settingBool(`reminders_${c}`))

  for (const m of db.memberships) {
    if (m.isCancelled || m.verificationStatus === 'rejected' || m.startDate > t) continue
    if (onlyUserId !== undefined && m.userId !== onlyUserId) continue
    const days = daysBetween(t, m.expiryDate)
    if (days < -7 || days > first) continue
    const later = db.memberships.some((o) => o.userId === m.userId && o.id !== m.id && !o.isCancelled && o.verificationStatus !== 'rejected' && o.expiryDate > m.expiryDate)
    if (later) continue
    const u = db.users.find((x) => x.id === m.userId)
    if (!u || !u.isActive) continue
    s.checked++
    const type = dueType(days)
    if (!type) continue
    const copy = reminderCopy(type, u.name, days, m.expiryDate)
    for (const channel of channels) {
      let recipient: string | null = null
      let skip: string | null = null
      if (channel === 'email') {
        recipient = u.email
        if (!u.emailOptIn) skip = 'Member turned off email alerts'
      } else if (channel === 'whatsapp') {
        recipient = u.phone
        if (!u.whatsappOptIn) skip = 'Member turned off WhatsApp alerts'
        else if (!u.phone) skip = 'No phone number on file'
      }
      const row = notifyOnce({ userId: u.id, membershipId: m.id, type, channel, status: skip ? 'skipped' : 'pending', ...copy, recipient, error: skip })
      if (!row) continue
      s.created++
      if (skip) {
        s.skipped++
        continue
      }
      s[dispatch(row) === 'sent' ? 'sent' : 'failed']++
    }
  }
  db.settings.reminders_last_run = now()
  return s
}

function notifyDashboard(userId: number, membershipId: number, type: NotificationType, title: string, message: string) {
  const row = notifyOnce({ userId, membershipId, type, channel: 'dashboard', status: 'pending', title, message, recipient: null, error: null })
  if (row) dispatch(row)
}

/* ── validation (same messages as backend/app/lib/validate.php) ── */

type Errors = Record<string, string>
const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '')

function vString(input: Record<string, unknown>, f: string, e: Errors, min: number, max: number, label: string) {
  const v = str(input[f]).replace(/\s+/g, ' ')
  if (min > 0 && !v) e[f] = `${label} is required.`
  else if (v.length < min) e[f] = `${label} must be at least ${min} characters.`
  else if (v.length > max) e[f] = `${label} must be at most ${max} characters.`
  return v
}
function vEmail(input: Record<string, unknown>, f: string, e: Errors) {
  const v = str(input[f]).toLowerCase()
  if (!v) e[f] = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) e[f] = 'Enter a valid email address.'
  return v
}
function vPhone(input: Record<string, unknown>, f: string, e: Errors, required = true): string | null {
  const raw = str(input[f])
  if (!raw) {
    if (required) e[f] = 'Phone number is required.'
    return null
  }
  let d = raw.replace(/\D+/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  if (!/^[6-9]\d{9}$/.test(d)) {
    e[f] = 'Enter a valid 10-digit mobile number.'
    return null
  }
  return `+91${d}`
}
function vDate(input: Record<string, unknown>, f: string, e: Errors, label: string, min?: string, max?: string) {
  const v = str(input[f])
  if (!v) {
    e[f] = `${label} is required.`
    return ''
  }
  if (!isValidISO(v)) e[f] = `${label} must be a valid date.`
  else if (min && v < min) e[f] = `${label} is too far in the past.`
  else if (max && v > max) e[f] = `${label} can't be that far in the future.`
  return v
}
function vPassword(input: Record<string, unknown>, f: string, e: Errors) {
  const v = String(input[f] ?? '')
  if (!v) e[f] = 'Password is required.'
  else if (v.length < 8) e[f] = 'Use at least 8 characters.'
  else if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) e[f] = 'Use letters and at least one number.'
  return v
}
function failIfErrors(e: Errors) {
  if (Object.keys(e).length) fail('Please check the highlighted fields.', 422, 'VALIDATION_FAILED', e)
}

function validatePersonal(input: Record<string, unknown>, e: Errors, userId: number) {
  const t = todayISO()
  const data = {
    name: vString(input, 'name', e, 2, 120, 'Full name'),
    email: vEmail(input, 'email', e),
    phone: vPhone(input, 'phone', e),
    dateOfBirth: vDate(input, 'dateOfBirth', e, 'Date of birth', addDays(t, -36525), addDays(t, -3652)),
    gender: (['male', 'female', 'other', 'prefer_not'].includes(str(input.gender)) ? str(input.gender) : null) as Gender | null,
    address: vString(input, 'address', e, 5, 500, 'Address'),
  }
  if (!data.gender) e.gender = str(input.gender) ? 'Choose a valid gender.' : 'Gender is required.'
  if (!e.email && load().users.some((u) => u.email === data.email && u.id !== userId)) e.email = 'Another account already uses this email.'
  return data
}

function validateMembership(input: Record<string, unknown>, e: Errors) {
  const plan = load().plans.find((p) => p.id === Number(input.planId))
  if (!plan) e.planId = 'Choose your membership plan.'
  const t = todayISO()
  const purchase = vDate(input, 'purchaseDate', e, 'Purchase date', addDays(t, -730), t)
  const start = vDate(input, 'startDate', e, 'Start date', addDays(t, -730), addDays(t, 90))
  if (!e.purchaseDate && !e.startDate && start < purchase) e.startDate = 'Start date can’t be before the purchase date.'
  const duration = Number(input.durationDays ?? plan?.durationDays)
  if (!Number.isInteger(duration)) e.durationDays = 'Membership duration must be a whole number.'
  else if (duration < 1 || duration > 730) e.durationDays = 'Membership duration must be between 1 and 730.'
  const receipt = str(input.receiptNumber)
  return { plan: plan!, purchase, start, duration, expiry: !e.startDate && !e.durationDays ? calcExpiry(start, duration) : '', receipt: receipt || null }
}

function createMembership(userId: number, d: ReturnType<typeof validateMembership>, source: 'member' | 'admin'): DbMembership {
  const m: DbMembership = {
    id: nextId(), userId, planId: d.plan.id, planName: d.plan.name, purchaseDate: d.purchase, startDate: d.start,
    durationDays: d.duration, expiryDate: d.expiry, verificationStatus: source === 'admin' ? 'verified' : 'pending',
    source, receiptNumber: d.receipt, isCancelled: false, createdAt: now(),
  }
  load().memberships.push(m)
  return m
}

/* ── auth helpers ────────────────────────────────────────── */

function currentUser(): DbUser | null {
  const id = sessionUserId()
  const u = id ? load().users.find((x) => x.id === id) : undefined
  return u && u.isActive ? u : null
}
function requireLogin(): DbUser {
  const u = currentUser()
  if (!u) fail('Please sign in to continue.', 401, 'UNAUTHENTICATED')
  return u
}
function requireAdmin(): DbUser {
  const u = requireLogin()
  if (u.role !== 'admin') fail('You do not have access to this area.', 403, 'FORBIDDEN')
  return u
}

function gymInfo(): GymInfo {
  return {
    name: setting('gym_name'), tagline: setting('gym_tagline'), address: setting('gym_address'), phone: setting('gym_phone'),
    whatsapp: setting('gym_whatsapp'), email: setting('gym_email'), hoursWeekdays: setting('gym_hours_weekdays'),
    hoursWeekends: setting('gym_hours_weekends'), mapUrl: setting('gym_map_url'),
    mapQuery: setting('gym_map_query') || setting('gym_address'),
  }
}

function adminCustomer(u: DbUser, m: DbMembership | null, detail = false): AdminCustomer {
  const c: AdminCustomer = {
    id: u.id, name: u.name, email: u.email, phone: u.phone, gender: u.gender, onboardingStatus: u.onboardingStatus as OnboardingStatus,
    isActive: u.isActive, emailOptIn: u.emailOptIn, whatsappOptIn: u.whatsappOptIn, createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt, membership: m ? publicMembership(m) : null,
  }
  return detail ? { ...c, dateOfBirth: u.dateOfBirth, address: u.address, notes: u.notes } : c
}

function memberRows(search = '') {
  const q = search.toLowerCase()
  return load()
    .users.filter((u) => u.role === 'member')
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q) || (u.phone ?? '').includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => ({ user: u, membership: currentOf(u.id) }))
}

const rowStatus = (m: DbMembership | null) => (m ? publicMembership(m).status : 'none')

function paginate<T>(items: T[], q: Query) {
  const perPage = Math.min(100, Math.max(5, Number(q.perPage) || 20))
  const pages = Math.max(1, Math.ceil(items.length / perPage))
  const page = Math.min(Math.max(1, Number(q.page) || 1), pages)
  return { items: items.slice((page - 1) * perPage, page * perPage), total: items.length, page, perPage, pages }
}

function customerPayload(u: DbUser) {
  const rows = userMemberships(u.id)
  return {
    customer: adminCustomer(u, pickCurrent(rows), true),
    memberships: rows.map(publicMembership),
    notifications: load().notifications.filter((n) => n.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id).slice(0, 40).map((n) => publicNotification(n, true)),
  }
}

function adminSettings(): AdminSettings {
  return {
    gym_name: setting('gym_name'), gym_tagline: setting('gym_tagline'), gym_address: setting('gym_address'), gym_phone: setting('gym_phone'),
    gym_whatsapp: setting('gym_whatsapp'), gym_email: setting('gym_email'), gym_hours_weekdays: setting('gym_hours_weekdays'),
    gym_hours_weekends: setting('gym_hours_weekends'), gym_map_url: setting('gym_map_url'),
    gym_map_query: setting('gym_map_query'),
    reminders_email: settingBool('reminders_email'), reminders_whatsapp: settingBool('reminders_whatsapp'),
    reminders_dashboard: settingBool('reminders_dashboard'), reminder_first_days: settingInt('reminder_first_days'),
    reminder_second_days: settingInt('reminder_second_days'),
  }
}

/* ── API ─────────────────────────────────────────────────── */

export const mockApi: Api = {
  async session() {
    const u = currentUser()
    return ok({ user: u ? publicUser(u) : null, csrfToken: 'demo' })
  },

  async register(input) {
    const e: Errors = {}
    const name = vString(input, 'name', e, 2, 120, 'Full name')
    const email = vEmail(input, 'email', e)
    const phone = vPhone(input, 'phone', e)
    const password = vPassword(input, 'password', e)
    if (!e.password && input.confirmPassword !== password) e.confirmPassword = 'Passwords don’t match.'
    if (!input.acceptTerms) e.acceptTerms = 'Please accept the terms to continue.'
    if (!e.email && load().users.some((u) => u.email === email)) e.email = 'An account with this email already exists. Try signing in.'
    await wait()
    failIfErrors(e)
    const u: DbUser = {
      id: nextId(), name, email, phone, role: 'member', dateOfBirth: null, gender: null, address: null, onboardingStatus: 'pending',
      emailOptIn: true, whatsappOptIn: true, password, isActive: true, notes: null, lastLoginAt: now(), createdAt: now(),
    }
    load().users.push(u)
    setSession(u.id)
    return ok({ user: publicUser(u) }, 'Welcome to Apex Fitness!')
  },

  async login(input) {
    const e: Errors = {}
    const email = vEmail(input, 'email', e)
    if (!input.password) e.password = 'Password is required.'
    await wait()
    failIfErrors(e)
    const u = load().users.find((x) => x.email === email)
    if (!u || u.password !== input.password) fail('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS')
    if (!u.isActive) fail('This account is disabled. Please contact Apex Fitness.', 403, 'ACCOUNT_DISABLED')
    u.lastLoginAt = now()
    setSession(u.id)
    return ok({ user: publicUser(u) }, 'Signed in.')
  },

  async logout() {
    setSession(null)
    return ok(null, 'Signed out.')
  },

  async dashboard() {
    const u = requireLogin()
    runReminders(u.id)
    const rows = userMemberships(u.id)
    const mine = load().notifications.filter((n) => n.userId === u.id && n.channel === 'dashboard').sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    const current = pickCurrent(rows)
    return ok({
      user: publicUser(u), membership: current ? publicMembership(current) : null, historyCount: rows.length,
      notifications: mine.slice(0, 6).map((n) => publicNotification(n)), unreadCount: mine.filter((n) => !n.readAt).length, gym: gymInfo(),
    })
  },

  async setOnboarding(answer) {
    const u = requireLogin()
    if (answer !== 'member' && answer !== 'not_member') fail('Please check the highlighted fields.', 422, 'VALIDATION_FAILED', { answer: 'Choose a valid answer.' })
    u.onboardingStatus = answer
    return ok({ user: publicUser(u) }, 'Saved.')
  },

  async memberships() {
    const u = requireLogin()
    const rows = userMemberships(u.id)
    const cur = pickCurrent(rows)
    return ok({ current: cur ? publicMembership(cur) : null, history: rows.map(publicMembership) })
  },

  async addMembership(input) {
    const u = requireLogin()
    const e: Errors = {}
    const personal = validatePersonal(input as unknown as Record<string, unknown>, e, u.id)
    const m = validateMembership(input as unknown as Record<string, unknown>, e)
    if (!Object.keys(e).length && userMemberships(u.id).some((x) => x.planId === m.plan.id && x.startDate === m.start)) {
      e.startDate = 'You have already added this membership.'
    }
    await wait()
    failIfErrors(e)
    Object.assign(u, personal, { onboardingStatus: 'member' })
    const row = createMembership(u.id, m, 'member')
    notifyDashboard(u.id, row.id, 'membership_added', 'Membership linked',
      `Your ${row.planName} membership (${fmt(row.startDate)} → ${fmt(row.expiryDate)}) is now on your dashboard. Our team will verify it against your front-desk receipt.`)
    runReminders(u.id)
    return ok({ membership: publicMembership(row), user: publicUser(u) }, 'Membership added to your dashboard.')
  },

  async updateProfile(input) {
    const u = requireLogin()
    const e: Errors = {}
    const personal = validatePersonal(input as unknown as Record<string, unknown>, e, u.id)
    await wait()
    failIfErrors(e)
    Object.assign(u, personal, { emailOptIn: !!input.emailOptIn, whatsappOptIn: !!input.whatsappOptIn })
    return ok({ user: publicUser(u) }, 'Profile updated.')
  },

  async changePassword(input) {
    const u = requireLogin()
    const e: Errors = {}
    if (input.currentPassword !== u.password) e.currentPassword = 'Current password is incorrect.'
    const np = vPassword(input, 'newPassword', e)
    await wait()
    failIfErrors(e)
    u.password = np
    return ok(null, 'Password changed.')
  },

  async notifications() {
    const u = requireLogin()
    const all = load().notifications.filter((n) => n.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    return ok({
      items: all.filter((n) => n.channel === 'dashboard').map((n) => publicNotification(n)),
      deliveries: all.filter((n) => n.channel !== 'dashboard').map((n) => ({ channel: n.channel, status: n.status, type: n.type, sentAt: n.sentAt, createdAt: n.createdAt })),
    })
  },

  async markRead(input) {
    const u = requireLogin()
    for (const n of load().notifications) {
      if (n.userId !== u.id || n.channel !== 'dashboard' || n.readAt) continue
      if ('all' in input || n.id === input.id) n.readAt = now()
    }
    return ok(null, 'Marked as read.')
  },

  async plans() {
    return ok({ plans: load().plans.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.durationDays - b.durationDays) })
  },

  async gym() {
    return ok({ gym: gymInfo() })
  },

  async contact(input) {
    const e: Errors = {}
    const name = vString(input, 'name', e, 2, 120, 'Name')
    const email = vEmail(input, 'email', e)
    const phone = vPhone(input, 'phone', e, false)
    const topic = ['membership', 'personal_training', 'visit', 'general'].includes(input.topic) ? input.topic : 'general'
    const message = vString(input, 'message', e, 10, 2000, 'Message')
    await wait()
    failIfErrors(e)
    load().messages.unshift({ id: nextId(), name, email, phone, topic, message, status: 'new', createdAt: now() })
    return ok(null, 'Thanks! Our team will get back to you within one working day.')
  },

  /* ── admin ── */

  async adminOverview() {
    requireAdmin()
    const db = load()
    const last = db.settings.reminders_last_run
    if (!last || Date.now() - new Date(last.replace(' ', 'T')).getTime() > 3_600_000) runReminders()
    const rows = memberRows()
    const counts: Record<string, number> = { active: 0, expiring: 0, expired: 0, upcoming: 0, none: 0 }
    const byPlan: Record<string, number> = {}
    let pending = 0
    const expiringSoon: AdminCustomer[] = []
    for (const r of rows) {
      const st = rowStatus(r.membership)
      counts[st]++
      if (r.membership) {
        if (st !== 'expired') byPlan[r.membership.planName] = (byPlan[r.membership.planName] ?? 0) + 1
        if (r.membership.verificationStatus === 'pending') pending++
        if (st === 'expiring') expiringSoon.push(adminCustomer(r.user, r.membership))
      }
    }
    expiringSoon.sort((a, b) => a.membership!.daysRemaining - b.membership!.daysRemaining)
    const monthStart = todayISO().slice(0, 8) + '01'
    const within30 = (n: DbNotification) => daysBetween(n.createdAt.slice(0, 10), todayISO()) <= 30
    return ok({
      stats: {
        totalMembers: rows.length, active: counts.active + counts.upcoming, expiring: counts.expiring, expired: counts.expired,
        noMembership: counts.none, pendingVerification: pending, newThisMonth: rows.filter((r) => r.user.createdAt.slice(0, 10) >= monthStart).length,
        emailSent30d: db.notifications.filter((n) => n.channel === 'email' && n.status === 'sent' && within30(n)).length,
        whatsappSent30d: db.notifications.filter((n) => n.channel === 'whatsapp' && n.status === 'sent' && within30(n)).length,
        failedNotifications: db.notifications.filter((n) => n.status === 'failed').length,
      },
      byPlan: Object.entries(byPlan).sort(([a], [b]) => a.localeCompare(b)).map(([plan, count]) => ({ plan, count })),
      expiringSoon: expiringSoon.slice(0, 6),
      recentSignups: rows.slice(0, 5).map((r) => adminCustomer(r.user, r.membership)),
      recentMessages: [...db.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      remindersLastRun: db.settings.reminders_last_run ?? null,
    })
  },

  async adminCustomers(q) {
    requireAdmin()
    const status = String(q.status ?? 'all')
    const plan = Number(q.plan ?? 0)
    let rows = memberRows(String(q.q ?? '')).filter((r) => {
      if (plan > 0 && r.membership?.planId !== plan) return false
      if (status === 'all') return true
      if (status === 'pending') return r.membership?.verificationStatus === 'pending'
      return rowStatus(r.membership) === status
    })
    if (q.sort === 'name') rows = rows.sort((a, b) => a.user.name.localeCompare(b.user.name))
    if (q.sort === 'expiry') rows = rows.sort((a, b) => (a.membership?.expiryDate ?? '9999').localeCompare(b.membership?.expiryDate ?? '9999'))
    const page = paginate(rows, q)
    return ok({ ...page, items: page.items.map((r) => adminCustomer(r.user, r.membership)) })
  },

  async adminCustomer(id) {
    requireAdmin()
    const u = load().users.find((x) => x.id === id && x.role === 'member')
    if (!u) fail('Customer not found.', 404, 'NOT_FOUND')
    return ok(customerPayload(u))
  },

  async adminCustomerAction(id, action, payload) {
    requireAdmin()
    const db = load()
    const u = db.users.find((x) => x.id === id && x.role === 'member')
    if (!u) fail('Customer not found.', 404, 'NOT_FOUND')
    const e: Errors = {}
    let message = ''
    const mid = Number(payload.membershipId)
    const target = db.memberships.find((m) => m.id === mid && m.userId === id)
    switch (action) {
      case 'update_profile': {
        const personal = validatePersonal(payload, e, id)
        await wait()
        failIfErrors(e)
        Object.assign(u, personal, {
          notes: str(payload.notes) || null, isActive: payload.isActive !== false,
          emailOptIn: payload.emailOptIn !== false, whatsappOptIn: payload.whatsappOptIn !== false,
        })
        message = 'Customer updated.'
        break
      }
      case 'add_membership': {
        const m = validateMembership(payload, e)
        await wait()
        failIfErrors(e)
        const row = createMembership(id, m, 'admin')
        u.onboardingStatus = 'member'
        notifyDashboard(id, row.id, 'membership_added', 'New membership recorded', `Apex Fitness recorded your ${row.planName} membership: ${fmt(row.startDate)} → ${fmt(row.expiryDate)}.`)
        runReminders(id)
        message = 'Membership recorded.'
        break
      }
      case 'update_membership': {
        if (!target) fail('Membership not found.', 404, 'NOT_FOUND')
        const m = validateMembership(payload, e)
        await wait()
        failIfErrors(e)
        Object.assign(target, { planId: m.plan.id, planName: m.plan.name, purchaseDate: m.purchase, startDate: m.start, durationDays: m.duration, expiryDate: m.expiry, receiptNumber: m.receipt })
        message = 'Membership updated.'
        break
      }
      case 'verify_membership': {
        const status = String(payload.status) as VerificationStatus
        if (!['verified', 'rejected', 'pending'].includes(status)) fail('Please check the highlighted fields.', 422, 'VALIDATION_FAILED', { status: 'Choose a valid status.' })
        if (target) {
          target.verificationStatus = status
          if (status === 'verified') notifyDashboard(id, target.id, 'membership_verified', 'Membership verified', 'Apex Fitness has verified your membership. You’re all set — see you on the floor!')
        }
        message = 'Verification updated.'
        break
      }
      case 'set_password': {
        const pw = vPassword(payload, 'password', e)
        await wait()
        failIfErrors(e)
        u.password = pw
        message = 'Password reset. Share it with the member in person and ask them to change it.'
        break
      }
      case 'cancel_membership':
        if (target) target.isCancelled = true
        message = 'Membership removed.'
        break
    }
    return ok(customerPayload(u), message)
  },

  async adminMemberships(q) {
    requireAdmin()
    const db = load()
    const s = String(q.q ?? '').toLowerCase()
    const items = db.memberships
      .filter((m) => !m.isCancelled)
      .filter((m) => !q.verification || q.verification === 'all' || m.verificationStatus === q.verification)
      .filter((m) => !Number(q.plan) || m.planId === Number(q.plan))
      .map((m) => {
        const u = db.users.find((x) => x.id === m.userId)!
        return { ...publicMembership(m), userName: u.name, userEmail: u.email, userPhone: u.phone }
      })
      .filter((m) => !s || m.userName.toLowerCase().includes(s) || m.userEmail.includes(s) || (m.userPhone ?? '').includes(s) || (m.receiptNumber ?? '').toLowerCase().includes(s))
      .filter((m) => !q.status || q.status === 'all' || m.status === q.status)
      .sort((a, b) => b.startDate.localeCompare(a.startDate) || b.id - a.id)
    return ok(paginate(items, q))
  },

  async adminExpiring() {
    requireAdmin()
    const first = settingInt('reminder_first_days')
    const second = settingInt('reminder_second_days')
    const out: ExpiringData = { firstDays: first, secondDays: second, first: [], second: [], expired: [] }
    for (const r of memberRows()) {
      if (!r.membership) continue
      const pm = publicMembership(r.membership)
      if (pm.status !== 'expiring' && pm.status !== 'expired') continue
      const [group, type] = pm.status === 'expired' ? (['expired', 'expired'] as const) : pm.daysRemaining <= second ? (['second', 'reminder_second'] as const) : (['first', 'reminder_first'] as const)
      const cell = (c: Channel) => {
        const n = load().notifications.find((x) => x.membershipId === pm.id && x.type === type && x.channel === c)
        return n ? { status: n.status, error: n.error, sentAt: n.sentAt } : null
      }
      out[group].push({ ...adminCustomer(r.user, r.membership), reminderType: type, delivery: { dashboard: cell('dashboard'), email: cell('email'), whatsapp: cell('whatsapp') } })
    }
    out.first.sort((a, b) => a.membership!.expiryDate.localeCompare(b.membership!.expiryDate))
    out.second.sort((a, b) => a.membership!.expiryDate.localeCompare(b.membership!.expiryDate))
    out.expired.sort((a, b) => b.membership!.expiryDate.localeCompare(a.membership!.expiryDate))
    return ok(out)
  },

  async adminNotifications(q) {
    requireAdmin()
    const db = load()
    const s = String(q.q ?? '').toLowerCase()
    const items = db.notifications
      .filter((n) => !q.channel || q.channel === 'all' || n.channel === q.channel)
      .filter((n) => !q.status || q.status === 'all' || n.status === q.status)
      .map((n) => publicNotification(n, true))
      .filter((n) => !s || (n.userName ?? '').toLowerCase().includes(s) || (n.recipient ?? '').toLowerCase().includes(s))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    const summary: Record<string, number> = {}
    for (const n of db.notifications) summary[`${n.channel}|${n.status}`] = (summary[`${n.channel}|${n.status}`] ?? 0) + 1
    return ok({
      ...paginate(items, q),
      summary: Object.entries(summary).map(([k, count]) => ({ channel: k.split('|')[0], status: k.split('|')[1], count })),
    })
  },

  async adminRetryNotification(id) {
    requireAdmin()
    const n = load().notifications.find((x) => x.id === id)
    if (!n) fail('Notification not found.', 404, 'NOT_FOUND')
    if (n.status !== 'failed' && n.status !== 'pending') fail('Only failed or pending messages can be retried.', 409, 'NOT_RETRYABLE')
    const st = dispatch(n)
    return ok({ notification: publicNotification(n, true) }, st === 'sent' ? 'Message sent.' : `Still failing: ${n.error}`)
  },

  async adminRunReminders() {
    requireAdmin()
    const summary = runReminders()
    return ok({ summary }, summary.created === 0 ? 'All caught up — no new reminders were due.' : `${summary.created} new reminder(s): ${summary.sent} sent, ${summary.failed} failed, ${summary.skipped} skipped.`)
  },

  async adminPlans() {
    requireAdmin()
    const db = load()
    return ok({
      plans: [...db.plans].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => ({ ...p, memberships: db.memberships.filter((m) => m.planId === p.id && !m.isCancelled).length })),
    })
  },

  async adminSavePlan(input) {
    requireAdmin()
    const e: Errors = {}
    const name = vString(input as Record<string, unknown>, 'name', e, 2, 80, 'Plan name')
    const d = Number(input.durationDays)
    if (!Number.isInteger(d) || d < 1 || d > 730) e.durationDays = 'Duration must be between 1 and 730.'
    const price = input.price === null || (input.price as unknown) === '' || input.price === undefined ? null : Number(input.price)
    if (price !== null && (Number.isNaN(price) || price < 0)) e.price = 'Enter a valid price (or leave empty to hide it).'
    await wait()
    failIfErrors(e)
    const db = load()
    const data = {
      name, durationDays: d, price, tagline: input.tagline ?? null, features: (input.features ?? []).filter(Boolean).slice(0, 10),
      isFeatured: !!input.isFeatured, isActive: input.isActive !== false, sortOrder: Number(input.sortOrder) || 0,
    }
    let plan = db.plans.find((p) => p.id === input.id)
    if (plan) Object.assign(plan, data)
    else {
      plan = { id: nextId(), slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ...data }
      db.plans.push(plan)
    }
    return ok({ plan }, 'Plan saved.')
  },

  async adminSettings() {
    requireAdmin()
    return ok({ settings: adminSettings(), channels: { emailDriver: 'demo', whatsappDriver: 'demo' }, remindersLastRun: load().settings.reminders_last_run ?? null })
  },

  async adminSaveSettings(input) {
    requireAdmin()
    const e: Errors = {}
    const first = Number(input.reminder_first_days ?? settingInt('reminder_first_days'))
    const second = Number(input.reminder_second_days ?? settingInt('reminder_second_days'))
    if (!(first >= 1 && first <= 30)) e.reminder_first_days = 'Use a number of days between 1 and 30.'
    if (!(second >= 1 && second <= 30)) e.reminder_second_days = 'Use a number of days between 1 and 30.'
    else if (second >= first) e.reminder_second_days = 'The second reminder must come after the first (fewer days left).'
    if (input.gym_map_url && !/^https:\/\//i.test(input.gym_map_url)) e.gym_map_url = 'Use a full https:// link.'
    await wait()
    failIfErrors(e)
    const db = load()
    for (const [k, v] of Object.entries(input)) {
      if (!(k in DEFAULT_SETTINGS)) continue
      db.settings[k] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v)
    }
    return ok({ settings: adminSettings(), channels: { emailDriver: 'demo', whatsappDriver: 'demo' }, remindersLastRun: db.settings.reminders_last_run ?? null }, 'Settings saved.')
  },

  async adminMessages(q) {
    requireAdmin()
    return ok(paginate([...load().messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), q))
  },

  async adminUpdateMessage(id, status) {
    requireAdmin()
    const m = load().messages.find((x) => x.id === id)
    if (m) m.status = status
    return ok(null, 'Message updated.')
  },
}

/** Demo sign-ins shown on the login page in mock mode. */
export const DEMO_ACCOUNTS = [
  { label: 'Member', email: 'member@apexfitness.demo', password: 'ApexMember2026' },
  { label: 'Admin', email: 'admin@apexfitness.demo', password: 'ApexAdmin2026' },
]

/** Wipes the demo data (used by the "Reset demo" link). */
export function resetDemo() {
  cache = null
  try {
    localStorage.removeItem(DB_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}
