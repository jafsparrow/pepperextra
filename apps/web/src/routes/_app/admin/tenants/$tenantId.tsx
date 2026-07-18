import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/admin/tenants/$tenantId")({
  component: RouteComponent,
})

function RouteComponent() {
  const { tenantId } = Route.useParams()

  return <div>Tenant details {tenantId}</div>
}
