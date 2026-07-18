import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/org/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Admin settings placeholder</div>
}
