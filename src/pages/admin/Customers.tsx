import { CustomerList } from '../../components/admin/CustomerList'
import { AdminHeader } from '../../components/admin/Parts'
import { usePageTitle } from '../../lib/hooks'

export default function AdminCustomers() {
  usePageTitle('Customers')
  return (
    <>
      <AdminHeader title="Customers" text="Everyone who created an account — search, filter and open a customer to manage their details and memberships." />
      <CustomerList />
    </>
  )
}

export function AdminExpired() {
  usePageTitle('Expired members')
  return (
    <>
      <AdminHeader title="Expired members" text="Customers whose current membership has ended. Reach out to invite them back, then record the renewal on their profile." />
      <CustomerList fixedStatus="expired" />
    </>
  )
}
