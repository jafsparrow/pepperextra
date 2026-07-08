import { NavBar } from "@/shared/ui/components/navbar"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <div>Auth common ui</div>
      <Outlet />
    </div>
  )
}
