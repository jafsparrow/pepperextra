import { createFileRoute } from "@tanstack/react-router"
import { SupplierList } from "@/feature/supplier/ui/components/supplier-list"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/suppliers/")({
  component: SuppliersPage,
})

function SuppliersPage() {
  const { orgId } = useAdminContext()
  return <SupplierList orgId={orgId} />
}
