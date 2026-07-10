// routes/_authenticated/route.tsx
import { createFileRoute, Outlet, Link } from "@tanstack/react-router"
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

// Notice the route matching path string matches the pathless folder name
export const Route = createFileRoute("/_app")({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
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
