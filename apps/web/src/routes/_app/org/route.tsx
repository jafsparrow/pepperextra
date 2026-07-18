import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/org")({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="admin-layout">
      <div>navgar</div>
      <main className="admin-content">
        <Outlet /> {/* Admin sub-pages inject here */}
      </main>
    </div>
  )
}
