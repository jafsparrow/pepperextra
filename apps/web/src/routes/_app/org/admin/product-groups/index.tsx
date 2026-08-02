import { createFileRoute } from "@tanstack/react-router"
import { ProductGroupList } from "@/feature/product-group/ui/components/product-group-list"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/product-groups/")({
  component: ProductGroupsPage,
})

function ProductGroupsPage() {
  const { orgId } = useAdminContext()
  return <ProductGroupList orgId={orgId} />
}
