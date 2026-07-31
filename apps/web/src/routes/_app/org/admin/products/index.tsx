import { createFileRoute } from "@tanstack/react-router"
import { ProductList } from "@/feature/product/ui/components/product-list"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/products/")({
  component: ProductsPage,
})

function ProductsPage() {
  const { orgId, teamId } = useAdminContext()
  return <ProductList orgId={orgId} teamId={teamId} />
}
