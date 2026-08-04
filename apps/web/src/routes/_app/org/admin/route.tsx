import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { authClient } from "@repo/auth/client"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Package,
  Layers,
  Truck,
  Users,
  Store,
  Boxes,
  FolderTree,
  DollarSign,
} from "lucide-react"
import { BranchScopeSelector } from "@/shared/ui/components/branch-scope-selector"
import { useAdminContext } from "@/shared/org/admin-context"

export const Route = createFileRoute("/_app/org/admin")({
  component: AdminManagementLayout,
})

const navItems = [
  { title: "Products", to: "/org/admin/products", icon: Package },
  { title: "Product Groups", to: "/org/admin/product-groups", icon: Layers },
  { title: "Pricelist", to: "/org/admin/price-lists", icon: DollarSign },

  { title: "Categories", to: "/org/admin/categories", icon: FolderTree },
  { title: "Suppliers", to: "/org/admin/suppliers", icon: Truck },
  { title: "Customers", to: "/org/admin/customers", icon: Users },
] as const

function AdminManagementLayout() {
  const { teamId, setTeamId } = useAdminContext()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Page header with scope selector */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-gradient-to-r from-card to-muted/20 p-6 shadow-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Management
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Store className="h-3.5 w-3.5" />
              {activeOrg ? activeOrg.name : "Organization"} catalog &amp;
              accounts
            </p>
          </div>
        </div>
        <BranchScopeSelector value={teamId} onValueChange={setTeamId} />
      </div>

      {/* Sub-navigation */}
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

      <main className="space-y-6">
        <Outlet />
      </main>
    </div>
  )
}
