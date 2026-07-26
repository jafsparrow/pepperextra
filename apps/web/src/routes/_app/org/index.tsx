import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { authClient } from "@pepperextra/auth/client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { OrgAddModal } from "@/feature/org/ui/components/org-add-modal"
import { OrgStaffList } from "@/feature/org/ui/components/org-staff-list"
import { BranchList } from "@/feature/branch/ui/components/branch-list"
import {
  LayoutDashboard,
  Settings,
  Store,
  Users,
  DollarSign,
  Activity,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react"

export const Route = createFileRoute("/_app/org/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: orgs } = authClient.useListOrganizations()
  const { data: sessionResponse } = authClient.useSession()

  const loggedUser = sessionResponse?.user

  // Queries for calculating stats in the dashboard
  const { data: membersRes } = useQuery({
    queryKey: ["organisation-members-count", activeOrg?.id],
    queryFn: async () => {
      const res = await authClient.organization.listMembers({
        query: {
          filterField: "role",
          filterOperator: "ne",
          filterValue: "owner",
        },
      })
      if (res.error) throw new Error(res.error.message)
      return res.data.members
    },
    enabled: !!activeOrg?.id,
  })

  const { data: teamsRes } = useQuery({
    queryKey: ["branches-count", activeOrg?.id],
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!activeOrg?.id,
  })

  const staffCount = membersRes?.length || 0
  const branchCount = teamsRes?.length || 0

  const handleSelectOrg = async (orgId: string) => {
    await authClient.organization.setActive({
      organizationId: orgId,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // if (isActiveOrgLoading || isOrgsLoading) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
  //       <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  //       <p className="text-sm text-muted-foreground animate-pulse">Loading restaurant dashboard...</p>
  //     </div>
  //   )
  // }

  // State 1: No organizations created yet at all
  if (!orgs || orgs.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 animate-bounce rounded-full bg-primary/10 p-4 text-primary">
          <Store className="h-12 w-12" />
        </div>
        <div className="text-2xl font-semibold">Hi..{loggedUser?.name}</div>

        <div>{JSON.stringify(activeOrg, null, 2)}</div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
          Welcome to PepperExtra
        </h1>
        <p className="mb-6 text-muted-foreground">
          To get started, you'll need to create an organization representing
          your main restaurant brand (e.g., mini-McDonald's).
        </p>
        <OrgAddModal>
          <Button
            size="lg"
            className="w-full gap-2 text-sm font-semibold shadow-md"
          >
            <Plus className="h-4 w-4" />
            Create Restaurant Brand
          </Button>
        </OrgAddModal>
      </div>
    )
  }

  // State 2: Has organizations but none is currently selected as active
  if (!activeOrg) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center p-8">
        <div className="mb-6 rounded-full bg-primary/10 p-3 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
          Select Restaurant Brand
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Please select an active restaurant brand to access the management
          panel or create a new one.
        </p>
        <div className="grid w-full max-w-md gap-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrg(org.id)}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/5 font-bold text-primary">
                    {getInitials(org.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {org.name}
                  </h4>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    slug: {org.slug}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          ))}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <OrgAddModal>
            <Button variant="outline" className="w-full gap-2 border-dashed">
              <Plus className="h-4 w-4" />
              Add Another Brand
            </Button>
          </OrgAddModal>
        </div>
      </div>
    )
  }

  // State 3: Active organization dashboard loaded
  return (
    <div className="space-y-6 py-6">
      {/* Brand Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-gradient-to-r from-card to-muted/20 p-6 shadow-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
            <AvatarFallback className="bg-primary/5 text-2xl font-black text-primary">
              {getInitials(activeOrg.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {activeOrg.name}
              </h1>
              <Badge
                variant="secondary"
                className="border border-primary/20 bg-primary/10 text-xs font-bold text-primary"
              >
                Restaurant Brand
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard for brand slug:{" "}
              <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-xs text-foreground">
                {activeOrg.slug}
              </code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Organization Switcher Dropdown (If they have other orgs) */}
          {orgs.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground lg:inline">
                Switch Brand:
              </span>
              <select
                value={activeOrg.id}
                onChange={(e) => handleSelectOrg(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <OrgAddModal>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Brand
            </Button>
          </OrgAddModal>

          <Button
            asChild
            size="sm"
            className="h-9 gap-1 bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Link to="/org/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Go to Dashboard
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1 text-xs font-semibold"
          >
            <Link to="/org/settings">
              <Settings className="h-3.5 w-3.5" />
              Brand Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total Branches */}
        <Card className="border border-border/40 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Total Branches
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Store className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">
              {branchCount}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Active branch locations managed via teams
            </p>
          </CardContent>
        </Card>

        {/* Stat 2: Staff Members */}
        <Card className="border border-border/40 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Active Staff
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">
              {staffCount}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Excludes primary brand owner account
            </p>
          </CardContent>
        </Card>

        {/* Stat 3: Mock Active Deliveries */}
        <Card className="border border-border/40 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Active Orders
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-emerald-600">
              48
            </div>
            <p className="mt-1 text-[10px] font-medium text-emerald-600/80">
              +12.5% increase in last 24h
            </p>
          </CardContent>
        </Card>

        {/* Stat 4: Mock Revenue */}
        <Card className="border border-border/40 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Daily Revenue
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-blue-600">
              $1,840.50
            </div>
            <p className="mt-1 text-[10px] font-medium text-blue-600/80">
              Target goal achieved for today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Branches and Staff */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1: Branches */}
        <BranchList orgId={activeOrg.id} />

        {/* Column 2: Staff */}
        <OrgStaffList orgId={activeOrg.id} />
      </div>
    </div>
  )
}
