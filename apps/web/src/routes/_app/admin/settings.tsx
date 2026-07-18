import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/admin/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Admin settings placeholder</div>
}
