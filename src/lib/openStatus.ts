/**
 * "Open now / Closed" from the gym's hours strings, e.g. "5:00 AM – 10:00 PM".
 * Mon–Sat use the weekday hours, Sunday the weekend hours. Returns null if the
 * hours can't be parsed (then the UI simply shows the text).
 */
function toMinutes(h: string, m: string, ap: string): number {
  let hour = Number(h) % 12
  if (ap.toUpperCase() === 'PM') hour += 12
  return hour * 60 + Number(m)
}

/** Day of week (0 = Sunday) and minutes since midnight at the gym (India Standard Time). */
function gymClock(now: Date): { day: number; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday ?? 'Mon')
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

export function openStatus(weekdays: string, weekends: string, now = new Date()): { open: boolean; label: string } | null {
  const clock = gymClock(now)
  const hours = clock.day === 0 ? weekends : weekdays
  const m = hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–—-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return null
  const start = toMinutes(m[1]!, m[2]!, m[3]!)
  const end = toMinutes(m[4]!, m[5]!, m[6]!)
  const t = clock.minutes
  const fmt = (h: string, mm: string, ap: string) => `${h}:${mm} ${ap.toUpperCase()}`
  return t >= start && t < end
    ? { open: true, label: `Open now · closes ${fmt(m[4]!, m[5]!, m[6]!)}` }
    : { open: false, label: `Closed · opens ${fmt(m[1]!, m[2]!, m[3]!)}` }
}
