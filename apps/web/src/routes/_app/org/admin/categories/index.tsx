import { createFileRoute } from "@tanstack/react-router"
import { CategoryList } from "@/feature/category/ui/components/category-list"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin/categories/")({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { orgId } = useAdminContext()
  return <CategoryList orgId={orgId} />
}
