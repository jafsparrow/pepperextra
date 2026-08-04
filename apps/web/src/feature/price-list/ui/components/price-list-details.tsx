import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ArrowLeft, ListChecks, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { PRICE_LIST_QUERY_KEYS } from "../../constants"
import { OverrideDialog } from "./price-list-override-dialog"
import type { PriceListOverride } from "@repo/contracts"

interface PriceListDetailsProps {
  orgId: string
  priceListId: string
}

export function PriceListDetails({
  orgId,
  priceListId,
}: PriceListDetailsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PriceListOverride | undefined>(
    undefined
  )
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { format } = useCurrency()

  const { data: priceList, isLoading } = useQuery(
    orpc.priceList.get.queryOptions({
      input: { organizationId: orgId, id: priceListId },
      enabled: !!orgId,
    })
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: PRICE_LIST_QUERY_KEYS.lists() })
    queryClient.invalidateQueries({
      queryKey: PRICE_LIST_QUERY_KEYS.detail(priceListId),
    })
  }

  const removeMutation = useMutation(
    orpc.priceList.removeOverride.mutationOptions({
      onSuccess: () => {
        toast.success("Product price removed")
        invalidate()
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const deleteTargetOverride = priceList?.overrides.find(
    (o) => o.productId === deleteTarget
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/org/admin/price-lists">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <ListChecks className="h-5 w-5 text-primary" />
              {priceList?.name ?? "Price list"}
            </CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading prices..."
                : `${priceList?.overrideCount ?? 0} product${
                    (priceList?.overrideCount ?? 0) === 1 ? "" : "s"
                  } priced. Unlisted products fall back to their sale price.`}
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add Product Price
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60" />
            </div>
          ) : (priceList?.overrides.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
              <ListChecks className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
              <h3 className="text-sm font-semibold">No product prices yet</h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Add a product price to override its sale price within this price
                list.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {priceList?.overrides.map((override) => (
                <div
                  key={override.productId}
                  className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ListChecks className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium text-foreground">
                        {override.productName ?? "Unknown product"}
                      </h4>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{override.skuCode}</span>
                        <span>
                          Base {format(override.basePriceMinor ?? "0")}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold tabular-nums"
                    >
                      {format(override.priceMinor)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(override)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(override.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <OverrideDialog
        orgId={orgId}
        priceListId={priceListId}
        existingProductIds={priceList?.overrides.map((o) => o.productId) ?? []}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        override={editing}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove product price</DialogTitle>
            <DialogDescription>
              {deleteTargetOverride?.productName ?? "This product"} will fall
              back to its sale price within this price list.
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
              disabled={removeMutation.isPending}
              onClick={() =>
                deleteTarget &&
                removeMutation.mutate({
                  organizationId: orgId,
                  id: priceListId,
                  productId: deleteTarget,
                })
              }
            >
              {removeMutation.isPending ? "Removing..." : "Remove price"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
