import { LayoutDashboard, Settings, Users, CreditCard } from "lucide-react"
import { Link } from "@tanstack/react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar"

// Navigation items catalog
const navigationItems = [
  { title: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { title: "Team Members", to: "/dashboard/team", icon: Users },
  { title: "Billing & Plans", to: "/settings/billing", icon: CreditCard },
  { title: "Settings", to: "/settings", icon: Settings },
]

export function AppSidebar() {
  return (
    // collapsible="icon" collapses the panel neatly to show just micro-icons on desktop
    <Sidebar collapsible="icon">
      {/* Sidebar Top Header */}
      <SidebarHeader className="flex h-16 items-center justify-start border-b px-4">
        <span className="text-lg font-bold tracking-tight">SaaS App</span>
      </SidebarHeader>

      {/* Middle Interactive Navigation List */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  {/* TanStack Link handles active styling states cleanly via search params / paths */}
                  <Link
                    to={item.to}
                    activeProps={{
                      className:
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Bottom Footer (Ideal for User Profiles / Sign Out buttons) */}
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">User Session Panel</div>
      </SidebarFooter>
    </Sidebar>
  )
}
