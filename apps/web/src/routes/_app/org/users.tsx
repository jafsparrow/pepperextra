import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/org/users")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/users"!</div>
}
