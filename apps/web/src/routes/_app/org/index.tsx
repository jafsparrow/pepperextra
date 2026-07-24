import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { authClient } from "@pepperextra/auth/client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
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
  const {data:sessionResponse } = authClient.useSession();

  const loggedUser = sessionResponse?.user;

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-md mx-auto text-center">
        <div className="p-4 bg-primary/10 text-primary rounded-full mb-6 animate-bounce">
          <Store className="h-12 w-12" />
        </div>
        <div className="text-2xl font-semibold">Hi..{loggedUser?.name}</div>

        <div>{JSON.stringify(activeOrg, null, 2)}</div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome to PepperExtra</h1>
        <p className="text-muted-foreground mb-6">
          To get started, you'll need to create an organization representing your main restaurant brand (e.g., mini-McDonald's).
        </p>
        <OrgAddModal>
          <Button size="lg" className="w-full gap-2 text-sm font-semibold shadow-md">
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-xl mx-auto">
        <div className="p-3 bg-primary/10 text-primary rounded-full mb-6">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-center">Select Restaurant Brand</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Please select an active restaurant brand to access the management panel or create a new one.
        </p>
        <div className="grid gap-3 w-full max-w-md">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrg(org.id)}
              className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/50 transition-all duration-200 text-left shadow-sm group hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {getInitials(org.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{org.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">slug: {org.slug}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border border-border/40 bg-gradient-to-r from-card to-muted/20 shadow-md">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
            <AvatarFallback className="bg-primary/5 text-primary font-black text-2xl">
              {getInitials(activeOrg.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{activeOrg.name}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs border border-primary/20 font-bold">
                Restaurant Brand
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dashboard for brand slug: <code className="font-mono text-xs text-foreground bg-muted/80 px-1 py-0.5 rounded">{activeOrg.slug}</code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Organization Switcher Dropdown (If they have other orgs) */}
          {orgs.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden lg:inline">Switch Brand:</span>
              <select
                value={activeOrg.id}
                onChange={(e) => handleSelectOrg(e.target.value)}
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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

          <Button asChild size="sm" className="h-9 gap-1 text-xs shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link to="/org/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Go to Dashboard
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 gap-1 text-xs font-semibold">
            <Link to="/admin/settings">
              <Settings className="h-3.5 w-3.5" />
              Brand Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total Branches */}
        <Card className="shadow-sm border border-border/40 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Branches
            </CardTitle>
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <Store className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{branchCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active branch locations managed via teams
            </p>
          </CardContent>
        </Card>

        {/* Stat 2: Staff Members */}
        <Card className="shadow-sm border border-border/40 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Staff
            </CardTitle>
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{staffCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Excludes primary brand owner account
            </p>
          </CardContent>
        </Card>

        {/* Stat 3: Mock Active Deliveries */}
        <Card className="shadow-sm border border-border/40 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Orders
            </CardTitle>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-md">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-emerald-600">48</div>
            <p className="text-[10px] text-emerald-600/80 font-medium mt-1">
              +12.5% increase in last 24h
            </p>
          </CardContent>
        </Card>

        {/* Stat 4: Mock Revenue */}
        <Card className="shadow-sm border border-border/40 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daily Revenue
            </CardTitle>
            <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-md">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-blue-600">$1,840.50</div>
            <p className="text-[10px] text-blue-600/80 font-medium mt-1">
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
