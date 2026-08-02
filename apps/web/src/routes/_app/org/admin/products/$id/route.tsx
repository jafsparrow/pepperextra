import { createFileRoute, useParams } from "@tanstack/react-router"
import { ProductDetails } from "@/feature/product/ui/components/product-details"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/products/$id")({
  component: ProductDetailsPage,
})

function ProductDetailsPage() {
  const { id } = useParams({ from: "/_app/org/admin/products/$id" })
  const { orgId } = useAdminContext()
  return <ProductDetails orgId={orgId ?? ""} productId={id} />
}
