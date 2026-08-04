import { createFileRoute } from "@tanstack/react-router"
import { PriceListList } from "@/feature/price-list/ui/components/price-list-list"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/price-lists/")({
  component: PriceListsPage,
})

function PriceListsPage() {
  const { orgId } = useAdminContext()
  return <PriceListList orgId={orgId} />
}
