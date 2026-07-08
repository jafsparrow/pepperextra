import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/planets/list")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/planets/list"! asddsf</div>
}
