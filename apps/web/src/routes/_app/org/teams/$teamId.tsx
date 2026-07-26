import { createFileRoute } from "@tanstack/react-router"
import { BranchDetails } from "@/feature/branch/ui/components/branch-details"

export const Route = createFileRoute("/_app/org/teams/$teamId")({
  component: RouteComponent,
})

function RouteComponent() {
  const { teamId } = Route.useParams()

  return <BranchDetails teamId={teamId} />
}
