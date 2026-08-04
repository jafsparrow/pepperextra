import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Package, Plus, Search, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { PRODUCT_QUERY_KEYS } from "../../constants"
import type { Product } from "@repo/contracts"

interface ProductAlternativesDialogProps {
  orgId: string
  product: Product
  children?: ReactNode
}

const MAX_RESULTS = 6

export function ProductAlternativesDialog({
  orgId,
  product,
  children,
}: ProductAlternativesDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const queryClient = useQueryClient()
  const { format } = useCurrency()

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const alternativesQueryKey = orpc.product.listAlternatives.queryKey({
    input: { organizationId: orgId, id: product.id },
  })

  const { data: alternatives, isLoading: alternativesLoading } = useQuery(
    orpc.product.listAlternatives.queryOptions({
      input: { organizationId: orgId, id: product.id },
      enabled: open,
    })
  )

  const { data: searchResults, isFetching: searchLoading } = useQuery(
    orpc.product.list.queryOptions({
      input: {
        organizationId: orgId,
        search: query.trim() || undefined,
      },
      enabled: open && query.trim().length > 0,
    })
  )

  const alternativeIds = new Set(
    (alternatives ?? []).map((a) => a.alternativeProductId)
  )

  const availableResults = (searchResults ?? [])
    .filter((p) => p.id !== product.id && !alternativeIds.has(p.id))
    .slice(0, MAX_RESULTS)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all })
    queryClient.invalidateQueries({ queryKey: alternativesQueryKey })
  }

  const addMutation = useMutation(
    orpc.product.addAlternative.mutationOptions({
      onSuccess: () => {
        toast.success("Alternative product added")
        invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const removeMutation = useMutation(
    orpc.product.removeAlternative.mutationOptions({
      onSuccess: () => {
        toast.success("Alternative product removed")
        invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const primaryMutation = useMutation(
    orpc.product.setPrimaryAlternative.mutationOptions({
      onSuccess: () => {
        toast.success("Primary alternative updated")
        invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    primaryMutation.isPending

  const removingId = removeMutation.isPending
    ? removeMutation.variables?.alternativeProductId
    : undefined
  const addingId = addMutation.isPending
    ? addMutation.variables?.alternativeProductId
    : undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            Manage alternatives
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alternative products</DialogTitle>
          <DialogDescription>
            Substitute products staff can offer instead of {product.name} on a
            quotation. Exactly one alternative is marked as the primary default.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products to add as an alternative..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {query.trim().length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border/40">
              {searchLoading ? (
                <p className="p-3 text-xs text-muted-foreground">Searching...</p>
              ) : availableResults.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  No matching products to add.
                </p>
              ) : (
                availableResults.map((p) => {
                  const pending = addingId === p.id
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 border-b border-border/40 p-2 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.name}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {p.skuCode} · Base {format(p.basePriceMinor)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-20 shrink-0 gap-1"
                        disabled={isPending}
                        onClick={() =>
                          addMutation.mutate({
                            organizationId: orgId,
                            id: product.id,
                            alternativeProductId: p.id,
                          })
                        }
                      >
                        {pending ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {pending ? "Adding" : "Add"}
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          )}

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Current alternatives ({alternatives?.length ?? 0})
            </h4>
            {alternativesLoading ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading...
              </p>
            ) : alternatives && alternatives.length > 0 ? (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/30 p-2"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {alt.alternative.name}
                        {alt.isPrimary && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px] font-semibold"
                          >
                            Primary
                          </Badge>
                        )}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {alt.alternative.skuCode} · Base{" "}
                        {format(alt.alternative.basePriceMinor)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                        disabled={alt.isPrimary || isPending}
                        onClick={() =>
                          primaryMutation.mutate({
                            organizationId: orgId,
                            id: product.id,
                            alternativeProductId:
                              alt.alternativeProductId,
                          })
                        }
                      >
                        <Star className="h-3.5 w-3.5" />
                        Make primary
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={isPending}
                        onClick={() =>
                          removeMutation.mutate({
                            organizationId: orgId,
                            id: product.id,
                            alternativeProductId:
                              alt.alternativeProductId,
                          })
                        }
                      >
                        {removingId === alt.alternativeProductId ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
                No alternatives yet. Search above to add one.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
