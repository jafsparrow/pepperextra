import { createFileRoute } from "@tanstack/react-router"
import { CustomerList } from "@/feature/customer/ui/components/customer-list"
import { useAdminContext } from "../route"

export const Route = createFileRoute("/_app/org/admin/customers/")({
  component: CustomersPage,
})

function CustomersPage() {
  const { orgId } = useAdminContext()
  return <CustomerList orgId={orgId} />
}
