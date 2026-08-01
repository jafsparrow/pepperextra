import { createFileRoute, useParams } from "@tanstack/react-router"
import { CustomerDetails } from "@/feature/customer/ui/components/customer-details"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/customers/$id")({
  component: CustomerDetailsPage,
})

function CustomerDetailsPage() {
  const { id } = useParams({ from: "/_app/org/admin/customers/$id" })
  const { orgId } = useAdminContext()
  return <CustomerDetails orgId={orgId ?? ""} customerId={id} />
}
