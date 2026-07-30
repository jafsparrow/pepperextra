import { useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
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
  Upload,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { EditBranchInfoDialog } from "./edit-branch-info-dialog"
import { EditAddressDialog } from "./edit-address-dialog"
import { EditContactDialog } from "./edit-contact-dialog"

interface BranchDetailsProps {
  teamId: string
  deploymentMode?: string
}

export function BranchDetails({
  teamId,
  deploymentMode = "local",
}: BranchDetailsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  const { data: teamsRes, isLoading: teamLoading } = useQuery({
    queryKey: ["team-name", teamId],
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })

  const { data: profile, isLoading: profileLoading } = useQuery(
    orpc.branchProfile.get.queryOptions({ input: { teamId } })
  )

  const team = teamsRes?.find((t) => t.id === teamId)
  const teamName = team?.name ?? profile?.name ?? "Branch"
  const branch = profile

  const isLoading = teamLoading || profileLoading

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (deploymentMode === "local") {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch(
          `http://localhost:3000/teams/${teamId}/emblem`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        )
        const data = await res.json()
        if (res.ok && data.url) {
          toast.success("Logo uploaded")
          // Invalidate to refresh the profile
          // queryClient.invalidateQueries(...)
        } else {
          toast.error("Upload failed")
        }
      } catch {
        toast.error("Upload failed")
      }
    } else {
      // Pseudo: client-side S3 upload
      console.log(
        `[S3 Upload Placeholder] Uploading ${file.name} for team ${teamId}`
      )
      toast.success("Logo upload simulated for cloud mode")
    }

    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/60" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-48 animate-pulse rounded-lg bg-muted/60" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <EditBranchInfoDialog
              teamId={teamId}
              defaultName={teamName}
              defaultTagline={branch?.tagline}
            >
              <button type="button" className="group cursor-pointer text-left">
                <h1 className="text-2xl font-bold tracking-tight group-hover:underline">
                  {teamName}
                </h1>
                <p className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  {branch?.tagline ?? "Restaurant branch"}
                </p>
              </button>
            </EditBranchInfoDialog>
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
              <div className="group relative">
                <div
                  className="flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted ring-4 ring-border/50"
                  onClick={handleLogoClick}
                >
                  {branch?.emblemImage ? (
                    <img
                      src={branch.emblemImage}
                      alt={`${teamName} emblem`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="h-14 w-14 text-muted-foreground/40" />
                  )}
                </div>
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={handleLogoClick}
                >
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileSelect}
                />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{teamName}</h3>
                <Badge variant="secondary" className="mt-1">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="space-y-6 md:col-span-2">
          {/* Address & Location */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  Address & Location
                </h3>
                <EditAddressDialog
                  teamId={teamId}
                  defaultAddress={branch?.address}
                  defaultLocation={branch?.location}
                  open={addressDialogOpen}
                  onOpenChange={setAddressDialogOpen}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </EditAddressDialog>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{branch?.address ?? "No address set"}</span>
                </div>
                {branch?.location && (
                  <div className="flex items-start gap-3">
                    <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {branch.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Map placeholder */}
              <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-border/40 bg-muted/50">
                <div className="text-center">
                  <MapPin className="mx-auto mb-1 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground/50">
                    Map preview
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Globe className="h-4 w-4 text-primary" />
                  Contact
                </h3>
                <EditContactDialog
                  teamId={teamId}
                  defaultPhone={branch?.phone}
                  defaultEmail={branch?.email}
                  open={contactDialogOpen}
                  onOpenChange={setContactDialogOpen}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </EditContactDialog>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{branch?.phone ?? "No phone set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
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
