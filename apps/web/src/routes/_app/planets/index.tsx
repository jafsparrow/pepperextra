import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/planets/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/planets/"!</div>
}
