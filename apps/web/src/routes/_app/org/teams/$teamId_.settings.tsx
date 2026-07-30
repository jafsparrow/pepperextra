import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
import { TeamSettings } from "@/feature/org/ui/components/team-settings"

export const Route = createFileRoute("/_app/org/teams/$teamId_/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  const { teamId } = Route.useParams()
  const { data: teamsRes } = useQuery({
    queryKey: ["team-name", teamId],
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })

  const team = teamsRes?.find((t) => t.id === teamId)
  const teamName = team?.name ?? "this location"

  return <TeamSettings teamId={teamId} teamName={teamName} />
}
