// Shapes returned by the PHP API (backend/public/**). Keep in sync with public_* helpers in backend/app/lib.

export type Role = 'member' | 'admin'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not'
export type OnboardingStatus = 'pending' | 'member' | 'not_member'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  dateOfBirth: string | null
  gender: Gender | null
  address: string | null
  onboardingStatus: OnboardingStatus
  emailOptIn: boolean
  whatsappOptIn: boolean
  createdAt: string
}

export interface Plan {
  id: number
  slug: string
  name: string
  durationDays: number
  price: number | null
  tagline: string | null
  features: string[]
  isFeatured: boolean
  isActive: boolean
  sortOrder: number
  memberships?: number
}

export type MembershipStatus = 'upcoming' | 'active' | 'expiring' | 'expired'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface Membership {
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
  createdAt: string
  status: MembershipStatus
  daysRemaining: number
  daysElapsed: number
  progress: number
}

export type NotificationType =
  | 'reminder_first'
  | 'reminder_second'
  | 'expired'
  | 'membership_added'
  | 'membership_verified'
  | 'custom'
export type Channel = 'dashboard' | 'email' | 'whatsapp'
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface AppNotification {
  id: number
  type: NotificationType
  channel: Channel
  status: DeliveryStatus
  title: string
  message: string
  read: boolean
  createdAt: string
  sentAt: string | null
  // admin only
  userId?: number
  userName?: string
  recipient?: string | null
  membershipId?: number | null
  attempts?: number
  error?: string | null
}

export interface GymInfo {
  name: string
  tagline: string
  address: string
  phone: string
  whatsapp: string
  email: string
  hoursWeekdays: string
  hoursWeekends: string
  mapUrl: string
  /** What the embedded map shows (place name or "lat, lng") — falls back to the address */
  mapQuery: string
}

export interface DashboardData {
  user: User
  membership: Membership | null
  historyCount: number
  notifications: AppNotification[]
  unreadCount: number
  gym: GymInfo
}

export interface Delivery {
  channel: Channel
  status: DeliveryStatus
  type: NotificationType
  sentAt: string | null
  createdAt: string
}

export interface PersonalInput {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  gender: Gender | ''
  address: string
}

export interface MembershipInput {
  planId: number | ''
  purchaseDate: string
  startDate: string
  durationDays: number | ''
  receiptNumber?: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  pages: number
}

export interface AdminCustomer {
  id: number
  name: string
  email: string
  phone: string | null
  gender: Gender | null
  onboardingStatus: OnboardingStatus
  isActive: boolean
  emailOptIn: boolean
  whatsappOptIn: boolean
  createdAt: string
  lastLoginAt: string | null
  membership: Membership | null
  // detail view only
  dateOfBirth?: string | null
  address?: string | null
  notes?: string | null
}

export interface DeliveryCell {
  status: DeliveryStatus
  error: string | null
  sentAt: string | null
}

export interface ExpiringCustomer extends AdminCustomer {
  reminderType: NotificationType
  delivery: Record<Channel, DeliveryCell | null>
}

export interface ExpiringData {
  firstDays: number
  secondDays: number
  first: ExpiringCustomer[]
  second: ExpiringCustomer[]
  expired: ExpiringCustomer[]
}

export interface ContactMessage {
  id: number
  name: string
  email: string
  phone: string | null
  topic: string
  message: string
  status: 'new' | 'handled'
  createdAt: string
}

export interface AdminOverview {
  stats: {
    totalMembers: number
    active: number
    expiring: number
    expired: number
    noMembership: number
    pendingVerification: number
    newThisMonth: number
    emailSent30d: number
    whatsappSent30d: number
    failedNotifications: number
  }
  byPlan: { plan: string; count: number }[]
  expiringSoon: AdminCustomer[]
  recentSignups: AdminCustomer[]
  recentMessages: ContactMessage[]
  remindersLastRun: string | null
}

export interface CustomerDetail {
  customer: AdminCustomer
  memberships: Membership[]
  notifications: AppNotification[]
}

export type AdminMembershipRow = Membership & { userName: string; userEmail: string; userPhone: string | null }

export interface AdminSettings {
  gym_name: string
  gym_tagline: string
  gym_address: string
  gym_phone: string
  gym_whatsapp: string
  gym_email: string
  gym_hours_weekdays: string
  gym_hours_weekends: string
  gym_map_url: string
  gym_map_query: string
  reminders_email: boolean
  reminders_whatsapp: boolean
  reminders_dashboard: boolean
  reminder_first_days: number
  reminder_second_days: number
}

export interface SettingsData {
  settings: AdminSettings
  channels: { emailDriver: string; whatsappDriver: string }
  remindersLastRun: string | null
}

export interface ReminderSummary {
  checked: number
  created: number
  sent: number
  failed: number
  skipped: number
  retried: number
}
