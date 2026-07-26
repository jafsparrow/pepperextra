import { createFileRoute } from "@tanstack/react-router"
import { OrgSettings } from "@/feature/org/ui/components/org-settings"

export const Route = createFileRoute("/_app/org/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return <OrgSettings />
}
