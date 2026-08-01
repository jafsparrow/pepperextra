import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { Plus, MapPin, MoreHorizontal, Pencil, Trash2, HardHat } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { CUSTOMER_QUERY_KEYS, SITE_STATUS_LABELS } from "../../constants"
import { SiteModal } from "./site-modal"
import type { CustomerSite } from "@repo/contracts"

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  on_hold: "secondary",
  completed: "outline",
  cancelled: "outline",
}

interface CustomerSitesProps {
  orgId: string
  customerId: string
  customerType: "retail" | "account" | "contractor"
}

export function CustomerSites({
  orgId,
  customerId,
  customerType,
}: CustomerSitesProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: sites, isLoading } = useQuery(
    orpc.customer.listSites.queryOptions({
      input: { organizationId: orgId, id: customerId },
      enabled: !!orgId && !!customerId,
    })
  )

  const deleteMutation = useMutation(
    orpc.customer.deleteSite.mutationOptions({
      onSuccess: () => {
        toast.success("Site deleted")
        queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.sites(customerId) })
        queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(customerId) })
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  if (customerType !== "contractor") {
    return null
  }

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <HardHat className="h-5 w-5 text-primary" />
            Sites
          </CardTitle>
          <CardDescription>
            Project sites with site manager names for this contractor.
          </CardDescription>
        </div>
        <SiteModal orgId={orgId} customerId={customerId}>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add site
          </Button>
        </SiteModal>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : !sites || sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center">
            <MapPin className="mb-2 h-8 w-8 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No sites yet</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Add the project sites where this contractor is working, including
              the site manager names.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className="rounded-lg border border-border/40 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          {site.name}
                        </h4>
                        <Badge
                          variant={STATUS_VARIANTS[site.status] ?? "outline"}
                          className="text-[10px] font-semibold capitalize"
                        >
                          {SITE_STATUS_LABELS[site.status]}
                        </Badge>
                      </div>
                      {site.address && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {site.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <SiteModal
                        orgId={orgId}
                        customerId={customerId}
                        site={site}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </SiteModal>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(site.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {site.contacts.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                    {site.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-2 text-xs">
                        <HardHat className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        <span className="font-medium text-foreground">
                          {contact.name}
                        </span>
                        {contact.phone && (
                          <span className="text-muted-foreground">
                            {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="hidden truncate text-muted-foreground sm:inline">
                            {contact.email}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete site</DialogTitle>
            <DialogDescription>
              This will remove the site and its managers. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget &&
                deleteMutation.mutate({
                  organizationId: orgId,
                  customerId,
                  siteId: deleteTarget,
                })
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete site"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export type { CustomerSite }
