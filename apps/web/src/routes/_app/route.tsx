// routes/_authenticated/route.tsx
import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router"
import { signOut } from "@repo/auth/client"
import { Button } from "@workspace/ui/components/button"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { AppSidebar } from "../../shared/ui/components/siderbar"
import { Separator } from "@workspace/ui/components/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { LogOut } from "lucide-react"
import { getServerSession } from "@/shared/utils/auth-session"

// Notice the route matching path string matches the pathless folder name
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const session = await getServerSession()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate({ to: "/login" })
  }

  return (
    <SidebarProvider>
      {/* 1. Renders the persistent sidebar panel */}
      <AppSidebar />

      <SidebarInset>
        {/* 2. Top Navigation Bar */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/admin">Workspace</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>View</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </header>

        {/* 3. The workspace panel where child components are injected */}
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          {/* This renders dashboard.tsx, settings.tsx, etc. */}
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
