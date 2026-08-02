import { useMemo, useState } from "react"
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
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { PRODUCT_QUERY_KEYS } from "../../constants"
import { ProductModal } from "./product-modal"

interface ProductListProps {
  orgId: string | undefined
  teamId?: string
}

export function ProductList({ orgId, teamId }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const [isExpanded, setIsExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { format } = useCurrency()

  const { data: products, isLoading } = useQuery(
    orpc.product.list.queryOptions({
      input: {
        organizationId: orgId ?? "",
        teamId,
      },
      enabled: !!orgId,
    })
  )

  const { data: productGroups } = useQuery(
    orpc.productGroup.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const { data: categories } = useQuery(
    orpc.category.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const groupName = (id: string | null | undefined) =>
    productGroups?.find((g) => g.id === id)?.specName ?? "—"

  const categoryName = (id: string | null | undefined) =>
    categories?.find((c) => c.id === id)?.name ?? "—"

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return (products ?? []).filter((p) => {
      if (groupFilter !== "all" && p.productGroupId !== groupFilter)
        return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q) ||
        (p.specCode ?? "").toLowerCase().includes(q) ||
        (p.brandTag ?? "").toLowerCase().includes(q)
      )
    })
  }, [products, searchQuery, groupFilter])

  const deleteMutation = useMutation(
    orpc.product.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Product deleted")
        queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() })
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
            <Package className="h-5 w-5 text-primary" />
            Products
          </CardTitle>
          <CardDescription>
            Manage your catalog of products and materials.
          </CardDescription>
        </div>
        {orgId && (
          <ProductModal orgId={orgId} categories={categories ?? []}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </ProductModal>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, spec or brand..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsExpanded(false)
              }}
              className="pl-9"
            />
          </div>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {productGroups?.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.specName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
            <Package className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No products found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery || groupFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Add your first product to start building your catalog."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((product) => (
              <div
                key={product.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-foreground">
                      <Link
                        to="/org/admin/products/$id"
                        params={{ id: product.id }}
                        className="transition-colors hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </h4>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{product.skuCode}</span>
                      <span>{groupName(product.productGroupId)}</span>
                      <span>{categoryName(product.categoryId)}</span>
                      {product.brandTag && <span>· {product.brandTag}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-sm font-semibold tabular-nums sm:inline">
                    {format(product.basePriceMinor)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <ProductModal
                        orgId={orgId ?? ""}
                        product={product}
                        categories={categories ?? []}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </ProductModal>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(product.id)}
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
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>
              This will remove the product from your catalog. This action cannot
              be undone.
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
              {deleteMutation.isPending ? "Deleting..." : "Delete product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
