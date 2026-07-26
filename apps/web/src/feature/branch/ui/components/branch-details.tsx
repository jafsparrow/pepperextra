import { useQuery } from "@tanstack/react-query"
import { authClient } from "@pepperextra/auth/client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  MapPin,
  Phone,
  Mail,
  Settings,
  Pencil,
  Store,
  Globe,
  Navigation,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { orpc } from "@/shared/utils/orpc"

interface BranchDetailsProps {
  teamId: string
}

export function BranchDetails({ teamId }: BranchDetailsProps) {
  const { data: teamsRes, isLoading: teamLoading } = useQuery({
    queryKey: ["team-name", teamId],
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })

  const { data: profile, isLoading: profileLoading } = useQuery(
    orpc.branchProfile.get.queryOptions({ input: { teamId } }),
  )

  const team = teamsRes?.find((t) => t.id === teamId)
  const teamName = team?.name ?? profile?.name ?? "Branch"
  const branch = profile

  const isLoading = teamLoading || profileLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/60 animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 bg-muted/60 animate-pulse rounded-lg" />
          <div className="h-48 bg-muted/60 animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{teamName}</h1>
            <p className="text-sm text-muted-foreground">
              {branch?.tagline ?? "Restaurant branch"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/org/teams/$teamId/settings" params={{ teamId }}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Emblem / Logo */}
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-border/50">
                  {branch?.emblemImage ? (
                    <img
                      src={branch.emblemImage}
                      alt={`${teamName} emblem`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-14 w-14 text-muted-foreground/40" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Pencil className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{teamName}</h3>
                <Badge variant="secondary" className="mt-1">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Address & Location */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Address & Location
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{branch?.address ?? "No address set"}</span>
                </div>
                {branch?.location && (
                  <div className="flex items-start gap-3">
                    <Navigation className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      {branch.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Map placeholder */}
              <div className="mt-4 h-40 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground/50">
                    Map preview
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Contact
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{branch?.phone ?? "No phone set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{branch?.email ?? "No email set"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
