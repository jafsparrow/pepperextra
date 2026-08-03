import { createFileRoute, useParams } from "@tanstack/react-router"
import { SupplierDetails } from "@/feature/supplier/ui/components/supplier-details"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/suppliers/$id")({
  component: SupplierDetailsPage,
})

function SupplierDetailsPage() {
  const { id } = useParams({ from: "/_app/org/admin/suppliers/$id" })
  const { orgId } = useAdminContext()
  return <SupplierDetails orgId={orgId ?? ""} supplierId={id} />
}