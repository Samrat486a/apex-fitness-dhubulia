import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ScrollManager, SiteLayout } from './components/layout/SiteLayout'
import { PageLoader } from './components/ui/Misc'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'

// Every page except Home is loaded on demand, so the first visit downloads as little as possible.
const LoginPage = lazy(() => import('./pages/Auth').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/Auth').then((m) => ({ default: m.RegisterPage })))
const ProgramsPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.ProgramsPage })))
const MembershipPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.MembershipPage })))
const AboutPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.ContactPage })))
const NotFoundPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.NotFoundPage })))

const Onboarding = lazy(() => import('./pages/Onboarding'))
const ProgramDetail = lazy(() => import('./pages/ProgramDetail'))
const MemberShell = lazy(() => import('./components/dashboard/MemberShell').then((m) => ({ default: m.MemberShell })))
const DashOverview = lazy(() => import('./pages/dashboard/Overview'))
const DashMembership = lazy(() => import('./pages/dashboard/MembershipPage'))
const DashNotifications = lazy(() => import('./pages/dashboard/Notifications'))
const DashProfile = lazy(() => import('./pages/dashboard/Profile'))

const AdminShell = lazy(() => import('./components/admin/AdminShell').then((m) => ({ default: m.AdminShell })))
const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const AdminCustomers = lazy(() => import('./pages/admin/Customers'))
const AdminExpired = lazy(() => import('./pages/admin/Customers').then((m) => ({ default: m.AdminExpired })))
const AdminCustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'))
const AdminMemberships = lazy(() => import('./pages/admin/Memberships'))
const AdminExpiring = lazy(() => import('./pages/admin/Expiring'))
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'))
const AdminPlans = lazy(() => import('./pages/admin/Plans'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminInquiries = lazy(() => import('./pages/admin/Inquiries'))

/** Members only. Admins go to /admin; members who haven't answered the onboarding question go there first. */
function RequireMember({ children, onboarding = false }: { children: ReactNode; onboarding?: boolean }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (!onboarding && user.onboardingStatus === 'pending') return <Navigate to="/onboarding" replace />
  // (Onboarding itself sends members who already answered to the dashboard — see pages/Onboarding.tsx.)
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:slug" element={<ProgramDetail />} />
            <Route path="membership" element={<MembershipPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="onboarding" element={<RequireMember onboarding><Onboarding /></RequireMember>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="dashboard" element={<RequireMember><MemberShell /></RequireMember>}>
            <Route index element={<DashOverview />} />
            <Route path="membership" element={<DashMembership />} />
            <Route path="notifications" element={<DashNotifications />} />
            <Route path="profile" element={<DashProfile />} />
          </Route>

          <Route path="admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
            <Route index element={<AdminOverview />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="memberships" element={<AdminMemberships />} />
            <Route path="expiring" element={<AdminExpiring />} />
            <Route path="expired" element={<AdminExpired />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
