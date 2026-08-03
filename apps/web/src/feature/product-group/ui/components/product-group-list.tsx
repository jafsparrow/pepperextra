import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Layers,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Boxes,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import {
  PRODUCT_GROUP_QUERY_KEYS,
  STOCK_TRACKING_LABELS,
} from "../../constants"
import { ProductGroupModal } from "./product-group-modal"
import { ProductGroupProductsModal } from "./product-group-products-modal"
import { ProductGroupDetailDialog } from "./product-group-detail-dialog"

interface ProductGroupListProps {
  orgId: string | undefined
}

export function ProductGroupList({ orgId }: ProductGroupListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: groups, isLoading } = useQuery(
    orpc.productGroup.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return (groups ?? []).filter(
      (g) =>
        !q ||
        g.specName.toLowerCase().includes(q) ||
        g.brandPriority?.some((b) => b.toLowerCase().includes(q))
    )
  }, [groups, searchQuery])

  const deleteMutation = useMutation(
    orpc.productGroup.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Product group deleted")
        queryClient.invalidateQueries({
          queryKey: PRODUCT_GROUP_QUERY_KEYS.lists(),
        })
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const initialLimit = 5
  const visible = isExpanded ? filtered : filtered.slice(0, initialLimit)

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Layers className="h-5 w-5 text-primary" />
            Product Groups
          </CardTitle>
          <CardDescription>
            Group products by spec name and set brand preferences.
          </CardDescription>
        </div>
        {orgId && (
          <ProductGroupModal orgId={orgId}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Product Group
            </Button>
          </ProductGroupModal>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search product groups or brands..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsExpanded(false)
            }}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
            <Layers className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No product groups found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria."
                : "Add your first product group to organize your product catalog."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((group) => (
              <div
                key={group.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all hover:bg-muted/60"
              >
                <ProductGroupDetailDialog orgId={orgId ?? ""} group={group}>
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                        {group.specName}
                      </h4>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {group.brandPriority && group.brandPriority.length > 0
                          ? group.brandPriority.join(" · ")
                          : "No brand priority set"}
                      </p>
                    </div>
                  </button>
                </ProductGroupDetailDialog>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="hidden text-xs font-semibold sm:inline-flex"
                  >
                    {STOCK_TRACKING_LABELS[group.stockTrackingMode]}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hidden text-xs font-semibold sm:inline-flex"
                  >
                    {group.productCount} product
                    {group.productCount === 1 ? "" : "s"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hidden text-xs font-semibold tabular-nums sm:inline-flex"
                  >
                    {group.groupStockTotal} in stock
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <ProductGroupProductsModal orgId={orgId ?? ""} group={group}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Boxes className="mr-2 h-4 w-4" />
                          Manage Products
                        </DropdownMenuItem>
                      </ProductGroupProductsModal>
                      <ProductGroupModal orgId={orgId ?? ""} group={group}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </ProductGroupModal>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(group.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filtered.length > initialLimit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    View Less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    View More ({filtered.length - initialLimit} more){" "}
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete product group</DialogTitle>
            <DialogDescription>
              This will remove the product group from your catalog. This action
              cannot be undone.
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
                  organizationId: orgId ?? "",
                  id: deleteTarget,
                })
              }
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete product group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
