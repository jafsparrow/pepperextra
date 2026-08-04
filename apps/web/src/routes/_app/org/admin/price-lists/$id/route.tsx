import { createFileRoute, useParams } from "@tanstack/react-router"
import { PriceListDetails } from "@/feature/price-list/ui/components/price-list-details"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/price-lists/$id")({
  component: PriceListDetailsPage,
})

function PriceListDetailsPage() {
  const { id } = useParams({ from: "/_app/org/admin/price-lists/$id" })
  const { orgId } = useAdminContext()
  return <PriceListDetails orgId={orgId ?? ""} priceListId={id} />
}
