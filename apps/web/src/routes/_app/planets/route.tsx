import {
  createFileRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router"

export const Route = createRootRoute({
  component: () => (
    <div className="app-container">
      {/* No shared navbars here, just the pure outlet */}
      <Outlet />
    </div>
  ),
})
