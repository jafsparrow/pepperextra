import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  LayoutDashboard,
  Users,
  Settings,
  Package,
  Building2,
} from "lucide-react"

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
})

const navItems = [
  { title: "Overview", to: "/admin", icon: LayoutDashboard },
  { title: "Users", to: "/admin/users", icon: Users },
  { title: "Tenants", to: "/admin/tenants", icon: Building2 },
  { title: "Products", to: "/org/admin/products", icon: Package },
  { title: "Settings", to: "/admin/settings", icon: Settings },
] as const

function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="admin-layout space-y-6">
      <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/40 bg-card/80 p-1 shadow-sm backdrop-blur-sm">
        {navItems.map((item) => {
          const isActive =
            pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <Button
              key={item.to}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-9 gap-2 px-4 text-sm font-semibold",
                !isActive && "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link to={item.to}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          )
        })}
      </nav>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
