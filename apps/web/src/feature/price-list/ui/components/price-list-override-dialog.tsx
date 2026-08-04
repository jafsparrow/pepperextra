import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { PRICE_LIST_QUERY_KEYS } from "../../constants"
import type { PriceListOverride, Product } from "@repo/contracts"

interface OverrideDialogProps {
  orgId: string
  priceListId: string
  existingProductIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  override?: PriceListOverride
}

const MAX_RESULTS = 6

function isValidPrice(value: string) {
  return value.trim() !== "" && !Number.isNaN(Number(value)) && Number(value) >= 0
}

export function OverrideDialog({
  orgId,
  priceListId,
  existingProductIds,
  open,
  onOpenChange,
  override,
}: OverrideDialogProps) {
  const queryClient = useQueryClient()
  const { fromMinorUnits, toMinorUnits, format } = useCurrency()

  const [query, setQuery] = useState("")
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [editPrice, setEditPrice] = useState("")

  const isEdit = !!override

  useEffect(() => {
    if (open) {
      setQuery("")
      setPrices({})
      setEditPrice(
        override ? fromMinorUnits(override.priceMinor).toString() : ""
      )
    }
  }, [open, override])

  const { data: searchResults, isFetching: searchLoading } = useQuery(
    orpc.product.list.queryOptions({
      input: {
        organizationId: orgId,
        search: query.trim() || undefined,
      },
      enabled: open && !isEdit && query.trim().length > 0,
    })
  )

  const excludedIds = useMemo(
    () => new Set(existingProductIds),
    [existingProductIds]
  )

  const availableResults = useMemo(
    () =>
      (searchResults ?? [])
        .filter((p) => !excludedIds.has(p.id))
        .slice(0, MAX_RESULTS),
    [searchResults, excludedIds]
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: PRICE_LIST_QUERY_KEYS.lists() })
    queryClient.invalidateQueries({
      queryKey: PRICE_LIST_QUERY_KEYS.detail(priceListId),
    })
  }

  const addMutation = useMutation(
    orpc.priceList.addOverride.mutationOptions({
      onSuccess: () => {
        toast.success("Product price added")
        invalidate()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.priceList.updateOverride.mutationOptions({
      onSuccess: () => {
        toast.success("Product price updated")
        invalidate()
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const pendingProductId = addMutation.isPending
    ? addMutation.variables?.productId
    : undefined

  const defaultPrice = (product: Product) =>
    fromMinorUnits(product.basePriceMinor).toString()

  const handleAdd = (product: Product) => {
    const price = prices[product.id] ?? defaultPrice(product)
    if (!isValidPrice(price)) {
      toast.error("Enter a valid price")
      return
    }
    addMutation.mutate({
      organizationId: orgId,
      id: priceListId,
      productId: product.id,
      priceMinor: toMinorUnits(price),
    })
  }

  const handleSaveEdit = () => {
    if (!override) return
    if (!isValidPrice(editPrice)) {
      toast.error("Enter a valid price")
      return
    }
    updateMutation.mutate({
      organizationId: orgId,
      id: priceListId,
      productId: override.productId,
      priceMinor: toMinorUnits(editPrice),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit product price" : "Add product price"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the fixed price for this product in the price list."
              : "Search for a product and set its fixed price. Products without a price here use the sale price."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && override ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
              <h4 className="truncate text-sm font-medium text-foreground">
                {override.productName ?? "Unknown product"}
              </h4>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{override.skuCode}</span>
                <span>Base {format(override.basePriceMinor ?? "0")}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="override-price"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Price (major units)
              </label>
              <Input
                id="override-price"
                type="text"
                inputMode="decimal"
                placeholder="12.500"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Entered in major units; converted to minor units for storage.
              </p>
            </div>

            <Button
              type="button"
              className="w-full gap-2"
              disabled={
                updateMutation.isPending || !isValidPrice(editPrice)
              }
              onClick={handleSaveEdit}
            >
              {updateMutation.isPending && (
                <Spinner className="h-4 w-4" />
              )}
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, spec or brand..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {query.trim().length === 0 ? (
              <p className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
                Type to search for a product to price.
              </p>
            ) : searchLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/40 p-3 text-xs text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Searching...
              </div>
            ) : availableResults.length === 0 ? (
              <p className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
                No matching products to add.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/40">
                {availableResults.map((product) => {
                  const price = prices[product.id] ?? defaultPrice(product)
                  const pending = pendingProductId === product.id
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 border-b border-border/40 p-2 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {product.skuCode} · Base{" "}
                          {format(product.basePriceMinor)}
                        </p>
                      </div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Price for ${product.name}`}
                        value={price}
                        disabled={addMutation.isPending}
                        onChange={(e) =>
                          setPrices((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="w-24 text-right"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="w-20 shrink-0 gap-1"
                        disabled={addMutation.isPending}
                        onClick={() => handleAdd(product)}
                      >
                        {pending ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {pending ? "Adding" : "Select"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
