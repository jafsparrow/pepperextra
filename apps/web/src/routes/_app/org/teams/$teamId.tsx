import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/org/teams/$teamId")({
  component: RouteComponent,
})

function RouteComponent() {
  const { teamId } = Route.useParams()

  return <div>Tenant details {teamId}</div>
}
