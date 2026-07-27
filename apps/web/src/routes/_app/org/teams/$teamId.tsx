import { createFileRoute } from "@tanstack/react-router"
import { BranchDetails } from "@/feature/branch/ui/components/branch-details"

export const Route = createFileRoute("/_app/org/teams/$teamId")({
  loader: () => ({
    deploymentMode: import.meta.env.VITE_DEPLOYMENT_MODE ?? "local",
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { teamId } = Route.useParams()
  const { deploymentMode } = Route.useLoaderData()

  return <BranchDetails teamId={teamId} deploymentMode={deploymentMode} />
}
