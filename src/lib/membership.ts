import type { MembershipStatus } from '../types'

/*
 * Membership date rules — mirrors backend/app/lib/memberships.php so forms can preview the
 * expiry date live. The server always recalculates; these values are never trusted.
 *
 *   expiry_date    = start_date + duration_days
 *   days_remaining = expiry_date − today
 */

const DAY = 86_400_000

/** Today as YYYY-MM-DD in the visitor's local time. */
export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses YYYY-MM-DD as a UTC midnight timestamp (no DST surprises when counting days). */
function utc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(utc(iso) + days * DAY)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / DAY)
}

export function calcExpiry(startDate: string, durationDays: number): string {
  return addDays(startDate, durationDays)
}

export function isValidISO(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(utc(iso))
}

export function membershipState(
  startDate: string,
  expiryDate: string,
  durationDays: number,
  firstReminderDays = 5,
  today = todayISO(),
): { status: MembershipStatus; daysRemaining: number; daysElapsed: number; progress: number } {
  const duration = Math.max(1, durationDays)
  const remaining = daysBetween(today, expiryDate)
  const elapsed = daysBetween(startDate, today)
  let status: MembershipStatus
  if (today < startDate) status = 'upcoming'
  else if (remaining <= 0) status = 'expired'
  else if (remaining <= firstReminderDays) status = 'expiring'
  else status = 'active'
  return {
    status,
    daysRemaining: Math.max(0, Math.min(remaining, duration)),
    daysElapsed: Math.max(0, Math.min(elapsed, duration)),
    progress: Math.round(Math.max(0, Math.min(1, elapsed / duration)) * 10000) / 10000,
  }
}

export const STATUS_LABEL: Record<MembershipStatus | 'none', string> = {
  active: 'Active',
  expiring: 'Expiring soon',
  expired: 'Expired',
  upcoming: 'Starts soon',
  none: 'No membership',
}
