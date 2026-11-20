const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })

/** Server dates are "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" in gym-local time. */
export function parseDate(value: string): Date {
  return new Date(value.length <= 10 ? `${value}T00:00:00` : value.replace(' ', 'T'))
}

export const formatDate = (v?: string | null) => (v ? dateFmt.format(parseDate(v)) : '—')
export const formatShort = (v?: string | null) => (v ? shortFmt.format(parseDate(v)) : '—')
export const formatDateTime = (v?: string | null) => (v ? `${dateFmt.format(parseDate(v))}, ${timeFmt.format(parseDate(v))}` : '—')

export function timeAgo(v: string): string {
  const diff = (Date.now() - parseDate(v).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return formatShort(v)
}

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

/** +919830011223 → +91 98300 11223 */
export function formatPhone(p?: string | null): string {
  if (!p) return '—'
  const m = p.match(/^\+91(\d{5})(\d{5})$/)
  return m ? `+91 ${m[1]} ${m[2]}` : p
}

export function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export const GENDER_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not: 'Prefer not to say',
}

export const TOPIC_LABEL: Record<string, string> = {
  membership: 'Membership',
  personal_training: 'Personal training',
  visit: 'Visit / trial',
  general: 'General',
}
