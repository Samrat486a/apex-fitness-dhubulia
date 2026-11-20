import type {
  AdminCustomer,
  AdminMembershipRow,
  AdminOverview,
  AdminSettings,
  AppNotification,
  ContactMessage,
  CustomerDetail,
  DashboardData,
  Delivery,
  ExpiringData,
  GymInfo,
  Membership,
  MembershipInput,
  Paginated,
  PersonalInput,
  Plan,
  ReminderSummary,
  SettingsData,
  User,
} from '../types'

/*
 * One API surface for the whole app.
 *
 *   VITE_API_MODE=live → PHP + MySQL backend under VITE_API_BASE (/api). Session cookie +
 *                        CSRF token (fetched from /auth/session.php, retried once if stale).
 *   VITE_API_MODE=mock → in-browser demo backend (src/lib/mock.ts) with the same rules,
 *                        for design previews without PHP. Never included in live builds.
 */

export class ApiError extends Error {
  status: number
  code?: string
  errors: Record<string, string>
  constructor(message: string, status: number, code?: string, errors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.errors = errors
  }
}

export interface Result<T> {
  message: string
  data: T
}

export type Query = Record<string, string | number | undefined>

export type CustomerAction = 'update_profile' | 'add_membership' | 'update_membership' | 'verify_membership' | 'cancel_membership' | 'set_password'

export interface Api {
  session(): Promise<Result<{ user: User | null; csrfToken: string }>>
  register(input: { name: string; email: string; phone: string; password: string; confirmPassword: string; acceptTerms: boolean }): Promise<Result<{ user: User }>>
  login(input: { email: string; password: string }): Promise<Result<{ user: User }>>
  logout(): Promise<Result<null>>

  dashboard(): Promise<Result<DashboardData>>
  setOnboarding(answer: 'member' | 'not_member'): Promise<Result<{ user: User }>>
  memberships(): Promise<Result<{ current: Membership | null; history: Membership[] }>>
  addMembership(input: PersonalInput & MembershipInput): Promise<Result<{ membership: Membership; user: User }>>
  updateProfile(input: PersonalInput & { emailOptIn: boolean; whatsappOptIn: boolean }): Promise<Result<{ user: User }>>
  changePassword(input: { currentPassword: string; newPassword: string }): Promise<Result<null>>
  notifications(): Promise<Result<{ items: AppNotification[]; deliveries: Delivery[] }>>
  markRead(input: { id: number } | { all: true }): Promise<Result<null>>

  plans(): Promise<Result<{ plans: Plan[] }>>
  gym(): Promise<Result<{ gym: GymInfo }>>
  contact(input: { name: string; email: string; phone: string; topic: string; message: string }): Promise<Result<null>>

  adminOverview(): Promise<Result<AdminOverview>>
  adminCustomers(q: Query): Promise<Result<Paginated<AdminCustomer>>>
  adminCustomer(id: number): Promise<Result<CustomerDetail>>
  adminCustomerAction(id: number, action: CustomerAction, payload: Record<string, unknown>): Promise<Result<CustomerDetail>>
  adminMemberships(q: Query): Promise<Result<Paginated<AdminMembershipRow>>>
  adminExpiring(): Promise<Result<ExpiringData>>
  adminNotifications(q: Query): Promise<Result<Paginated<AppNotification> & { summary: { channel: string; status: string; count: number }[] }>>
  adminRetryNotification(id: number): Promise<Result<{ notification: AppNotification }>>
  adminRunReminders(): Promise<Result<{ summary: ReminderSummary }>>
  adminPlans(): Promise<Result<{ plans: Plan[] }>>
  adminSavePlan(input: Partial<Plan>): Promise<Result<{ plan: Plan }>>
  adminSettings(): Promise<Result<SettingsData>>
  adminSaveSettings(input: Partial<AdminSettings>): Promise<Result<SettingsData>>
  adminMessages(q: Query): Promise<Result<Paginated<ContactMessage>>>
  adminUpdateMessage(id: number, status: 'new' | 'handled'): Promise<Result<null>>
}

export const API_MODE: 'live' | 'mock' = import.meta.env.VITE_API_MODE === 'mock' ? 'mock' : 'live'
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api'

/* ── Live client ─────────────────────────────────────────── */

let csrfToken: string | null = null

function qs(q?: Query): string {
  if (!q) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function call<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown; query?: Query } = {}, retried = false): Promise<Result<T>> {
  const method = init.method ?? 'GET'
  if (method === 'POST' && !csrfToken) await live.session()

  let res: Response
  try {
    res = await fetch(`${BASE}${path}${qs(init.query)}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken ?? '' } : {}),
      },
      body: method === 'POST' ? JSON.stringify(init.body ?? {}) : undefined,
    })
  } catch {
    throw new ApiError('Can’t reach Apex Fitness right now. Check your connection and try again.', 0, 'NETWORK')
  }

  let json: { success?: boolean; message?: string; data?: T; code?: string; errors?: Record<string, string> } = {}
  try {
    json = await res.json()
  } catch {
    throw new ApiError('Unexpected response from the server.', res.status, 'BAD_RESPONSE')
  }

  if (res.status === 419 && !retried) {
    csrfToken = null
    return call<T>(path, init, true)
  }
  if (!res.ok || !json.success) {
    throw new ApiError(json.message ?? 'Something went wrong.', res.status, json.code, json.errors ?? {})
  }
  const data = (json.data ?? null) as T & { csrfToken?: string }
  if (data && typeof data === 'object' && 'csrfToken' in data && data.csrfToken) csrfToken = data.csrfToken
  return { message: json.message ?? '', data }
}

const post = <T>(path: string, body?: unknown) => call<T>(path, { method: 'POST', body })

const live: Api = {
  session: () => call('/auth/session.php'),
  register: (input) => post('/auth/register.php', input),
  login: (input) => post('/auth/login.php', input),
  logout: async () => {
    const r = await post<null>('/auth/logout.php')
    csrfToken = null
    return r
  },

  dashboard: () => call('/member/dashboard.php'),
  setOnboarding: (answer) => post('/member/onboarding.php', { answer }),
  memberships: () => call('/member/membership.php'),
  addMembership: (input) => post('/member/membership.php', input),
  updateProfile: (input) => post('/member/profile.php', input),
  changePassword: (input) => post('/member/password.php', input),
  notifications: () => call('/member/notifications.php'),
  markRead: (input) => post('/member/notifications.php', input),

  plans: () => call('/plans/list.php'),
  gym: () => call('/gym/info.php'),
  contact: (input) => post('/contact/submit.php', input),

  adminOverview: () => call('/admin/overview.php'),
  adminCustomers: (query) => call('/admin/customers.php', { query }),
  adminCustomer: (id) => call('/admin/customer.php', { query: { id } }),
  adminCustomerAction: (id, action, payload) => post('/admin/customer.php', { ...payload, id, action }),
  adminMemberships: (query) => call('/admin/memberships.php', { query }),
  adminExpiring: () => call('/admin/expiring.php'),
  adminNotifications: (query) => call('/admin/notifications.php', { query }),
  adminRetryNotification: (id) => post('/admin/notifications.php', { id }),
  adminRunReminders: () => post('/admin/reminders.php'),
  adminPlans: () => call('/admin/plans.php'),
  adminSavePlan: (input) => post('/admin/plans.php', input),
  adminSettings: () => call('/admin/settings.php'),
  adminSaveSettings: (input) => post('/admin/settings.php', input),
  adminMessages: (query) => call('/admin/messages.php', { query }),
  adminUpdateMessage: (id, status) => post('/admin/messages.php', { id, status }),
}

/* ── Mode switch ─────────────────────────────────────────── */

let mockPromise: Promise<Api> | null = null
function backend(): Promise<Api> {
  if (import.meta.env.VITE_API_MODE === 'mock') {
    mockPromise ??= import('./mock').then((m) => m.mockApi)
    return mockPromise
  }
  return Promise.resolve(live)
}

/** The API used by every page. Same methods in both modes. */
export const api = new Proxy({} as Api, {
  get(_t, prop: keyof Api) {
    return (...args: unknown[]) =>
      backend().then((impl) => (impl[prop] as (...a: unknown[]) => Promise<unknown>)(...args))
  },
})

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong.'
}

export function fieldErrors(e: unknown): Record<string, string> {
  return e instanceof ApiError ? e.errors : {}
}
