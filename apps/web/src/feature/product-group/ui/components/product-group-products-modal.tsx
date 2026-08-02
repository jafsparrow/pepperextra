import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { PRODUCT_QUERY_KEYS } from "@/feature/product/constants"
import { PRODUCT_GROUP_QUERY_KEYS } from "../../constants"
import type { ProductGroup, Product } from "@repo/contracts"

interface ProductGroupProductsModalProps {
  orgId: string
  group: ProductGroup
  children?: ReactNode
}

export function ProductGroupProductsModal({
  orgId,
  group,
  children,
}: ProductGroupProductsModalProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const queryClient = useQueryClient()

  const { data: groupProducts, isLoading: groupLoading } = useQuery(
    orpc.productGroup.listProducts.queryOptions({
      input: { organizationId: orgId, id: group.id },
      enabled: open,
    })
  )

  const { data: searchResults, isFetching: searchLoading } = useQuery(
    orpc.product.list.queryOptions({
      input: {
        organizationId: orgId,
        search: searchQuery || undefined,
      },
      enabled: open && searchQuery.trim().length > 0,
    })
  )

  const groupProductIds = new Set(
    (groupProducts ?? []).map((p) => p.id)
  )

  const availableResults = (searchResults ?? []).filter(
    (p) => !groupProductIds.has(p.id)
  )

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: PRODUCT_QUERY_KEYS.lists(),
    })
    queryClient.invalidateQueries({
      queryKey: PRODUCT_GROUP_QUERY_KEYS.lists(),
    })
  }

  const addMutation = useMutation(
    orpc.productGroup.addProduct.mutationOptions({
      onSuccess: (product) => {
        toast.success(`${product.name} added to group`)
        invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const removeMutation = useMutation(
    orpc.productGroup.removeProduct.mutationOptions({
      onSuccess: (product) => {
        toast.success(`${product.name} removed from group`)
        invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleAdd = (product: Product) => {
    addMutation.mutate({
      organizationId: orgId,
      id: group.id,
      productId: product.id,
    })
  }

  const handleRemove = (product: Product) => {
    removeMutation.mutate({
      organizationId: orgId,
      id: group.id,
      productId: product.id,
    })
  }

  useEffect(() => {
    if (!open) setSearchQuery("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage products in {group.specName}</DialogTitle>
          <DialogDescription>
            Search your catalog and add products to this group.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, spec or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {searchQuery.trim().length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border/40">
            {searchLoading ? (
              <p className="p-3 text-xs text-muted-foreground">Searching...</p>
            ) : availableResults.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                No matching products to add.
              </p>
            ) : (
              availableResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 border-b border-border/40 p-2 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {product.skuCode}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    disabled={addMutation.isPending}
                    onClick={() => handleAdd(product)}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" />
            In this group ({groupProducts?.length ?? 0})
          </h4>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {groupLoading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : groupProducts && groupProducts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
                No products in this group yet. Search above to add some.
              </p>
            ) : (
              (groupProducts ?? []).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/30 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {product.skuCode}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 gap-1 text-destructive hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => handleRemove(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
