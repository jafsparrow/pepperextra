import { useState } from "react"
import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Boxes, Package, Tag } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { STOCK_TRACKING_LABELS } from "../../constants"
import type { ProductGroup } from "@repo/contracts"

interface ProductGroupDetailDialogProps {
  orgId: string
  group: ProductGroup
  children?: ReactNode
}

export function ProductGroupDetailDialog({
  orgId,
  group,
  children,
}: ProductGroupDetailDialogProps) {
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery(
    orpc.productGroup.detail.queryOptions({
      input: { organizationId: orgId, id: group.id },
      enabled: open,
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            View group
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            {group.specName}
          </DialogTitle>
          <DialogDescription>
            {STOCK_TRACKING_LABELS[group.stockTrackingMode]}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Products
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {data?.productCount ?? group.productCount}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Group stock
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {data?.groupStockTotal ?? group.groupStockTotal}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Tracking
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {STOCK_TRACKING_LABELS[group.stockTrackingMode]}
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" />
            Products in this group ({data?.products.length ?? 0})
          </h4>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60" />
                <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60" />
              </div>
            ) : data && data.products.length === 0 ? (
              <p className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
                No products in this group yet.
              </p>
            ) : (
              (data?.products ?? []).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/30 p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="flex items-center gap-1 truncate font-mono text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {product.skuCode}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs font-semibold tabular-nums"
                  >
                    {product.stockTotal} in stock
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
