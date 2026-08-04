import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { toast } from "sonner"
import {
  ArrowLeft,
  Package,
  Pencil,
  Copy,
  Camera,
  Layers,
  FolderTree,
  Tag,
  Boxes,
  ShoppingCart,
  CreditCard,
  StickyNote,
  Clock,
  Warehouse,
  MapPin,
  Shuffle,
} from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { PRODUCT_QUERY_KEYS } from "../../constants"
import { ProductModal } from "./product-modal"
import { ProductLoyaltyDialog } from "./product-loyalty-dialog"
import { ProductNotesDialog } from "./product-notes-dialog"
import { ProductAlternativesDialog } from "./product-alternatives-dialog"

interface ProductDetailsProps {
  orgId: string
  productId: string
}

export function ProductDetails({ orgId, productId }: ProductDetailsProps) {
  const { format } = useCurrency()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: product, isLoading } = useQuery(
    orpc.product.get.queryOptions({
      input: { organizationId: orgId, id: productId },
      enabled: !!orgId && !!productId,
    })
  )

  const { data: alternatives } = useQuery(
    orpc.product.listAlternatives.queryOptions({
      input: { organizationId: orgId, id: productId },
      enabled: !!orgId && !!productId,
    })
  )

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000"
      const res = await fetch(
        `${apiUrl}/organizations/${orgId}/products/${productId}/image`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? "Upload failed")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Product photo updated")
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all })
      setUploading(false)
    },
    onError: (error) => {
      toast.error(error.message)
      setUploading(false)
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    uploadMutation.mutate(file)
    e.target.value = ""
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 w-full animate-pulse rounded-2xl bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-center">
        <p className="text-sm font-medium">Product not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/org/admin/products">Back to products</Link>
        </Button>
      </div>
    )
  }

  const primaryImage = product.images?.find((img) => img.isPrimary) ?? null
  const imageUrl = primaryImage?.imageUrl ?? null

  const basePrice = Number(product.basePriceMinor)
  const costPrice = Number(product.activeCostPriceMinor ?? 0)
  const marginPct =
    basePrice > 0 ? Math.round(((basePrice - costPrice) / basePrice) * 100) : 0

  const reorderThreshold =
    product.reorderThreshold ?? product.productGroup?.groupReorderThreshold ?? undefined
  const stockTotal = Number(product.stockTotal ?? 0)
  const stockStatus =
    stockTotal === 0
      ? { label: "Out of stock", variant: "destructive" as const }
      : reorderThreshold !== undefined && stockTotal <= reorderThreshold
        ? { label: "Low stock", variant: "warning" as const }
        : { label: "In stock", variant: "outline" as const }

  const loyaltyMode = product.loyaltyPoints.mode
  const loyaltyValue = product.loyaltyPoints.value ?? 0
  const loyaltyLabel =
    loyaltyMode === "fixed"
      ? `${loyaltyValue} pts / unit`
      : loyaltyMode === "price_percent"
        ? `${loyaltyValue} pts per %`
        : "Not configured"

  const daysSinceCreated = product.createdAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(product.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null

  const stats = [
    {
      label: "Base price",
      value: format(product.basePriceMinor),
      icon: Tag,
      sub: product.unit ? `per ${product.unit}` : undefined,
    },
    {
      label: "Cost & margin",
      value: format(product.activeCostPriceMinor ?? 0),
      icon: ShoppingCart,
      sub: `${marginPct}% margin`,
    },
    {
      label: "Stock on hand",
      value: product.stockTotal ?? "0",
      icon: Warehouse,
      sub: `${product.stock?.length ?? 0} location${(product.stock?.length ?? 0) === 1 ? "" : "s"}`,
    },
    {
      label: "Stock health",
      value: stockStatus.label,
      icon: Boxes,
      sub:
        reorderThreshold !== undefined
          ? `Reorder at ${reorderThreshold}`
          : "No reorder threshold",
    },
  ]

  const detailItems = [
    { label: "SKU", value: product.skuCode },
    { label: "Spec code", value: product.specCode },
    { label: "Brand tag", value: product.brandTag },
    { label: "Category", value: product.categoryName },
    { label: "Product group", value: product.productGroup?.specName },
    {
      label: "Stock tracking",
      value:
        product.productGroup?.stockTrackingMode === "group"
          ? "Group (spec level)"
          : "Per SKU",
    },
    { label: "Unit", value: product.unit },
    { label: "Cost last updated", value: product.costLastUpdated },
    { label: "Created", value: product.createdAt },
    { label: "Aliases", value: product.aliases?.join(", ") },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
          <Link to="/org/admin/products">
            <ArrowLeft className="h-4 w-4" />
            Products
          </Link>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-muted/20 p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={primaryImage?.altText ?? product.name}
                  className="h-20 w-20 shrink-0 rounded-xl border border-border/40 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-10 w-10" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
                title="Change photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  {product.name}
                </h1>
                <Badge className="text-[11px] font-semibold capitalize">
                  {stockStatus.label}
                </Badge>
                {product.eligibleForLoyalty && (
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    Loyalty
                  </Badge>
                )}
                {product.needsNotes && (
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    Notes required
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {product.skuCode}
                </span>
                {product.brandTag && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {product.brandTag}
                  </span>
                )}
                {product.categoryName && (
                  <span className="flex items-center gap-1">
                    <FolderTree className="h-3.5 w-3.5" />
                    {product.categoryName}
                  </span>
                )}
                {product.productGroup && (
                  <span className="flex items-center gap-1">
                    <Boxes className="h-3.5 w-3.5" />
                    {product.productGroup.specName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <ProductModal orgId={orgId} product={product}>
              <Button size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </ProductModal>
            <ProductModal orgId={orgId} prefill={product}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Copy className="h-4 w-4" />
                Create new product from this
              </Button>
            </ProductModal>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {detailItems.map((item) => {
            let display: string | null =
              item.value === undefined ||
              item.value === null ||
              item.value === ""
                ? null
                : String(item.value)
            if (item.label === "Created" && display) {
              display = new Date(display).toLocaleDateString()
            }
            if (item.label === "Cost last updated" && display) {
              display = new Date(display).toLocaleDateString()
            }
            if (display === null) {
              return (
                <div key={item.label}>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    —
                  </p>
                </div>
              )
            }
            return (
              <div key={item.label}>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {display}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/40 bg-card/60 p-4"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <stat.icon className="h-4 w-4 text-primary" />
              {stat.label}
            </div>
            <p className="mt-1 text-lg font-bold text-foreground">
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Warehouse className="h-4 w-4 text-primary" />
            Stock details
          </h3>
          {product.stock && product.stock.length > 0 ? (
            <div className="space-y-2">
              {product.stock.map((s) => (
                <div
                  key={s.teamId}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {s.teamName ?? "Unnamed location"}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {s.quantity}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <span className="text-sm font-semibold text-foreground">
                  Total
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {product.stockTotal}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 py-8 text-center">
              <Warehouse className="mb-2 h-8 w-8 stroke-[1.5] text-muted-foreground" />
              <p className="text-sm font-medium">No stock tracked yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Stock is recorded per location when inventory is processed.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <MapPin className="h-4 w-4 text-primary" />
            Location price overrides
          </h3>
          {product.locationOverrides && product.locationOverrides.length > 0 ? (
            <div className="space-y-2">
              {product.locationOverrides.map((o) => (
                <div
                  key={o.teamId}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {o.teamName ?? "Unnamed location"}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {o.priceOverrideMinor
                        ? format(o.priceOverrideMinor)
                        : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      base {format(product.basePriceMinor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 py-8 text-center">
              <MapPin className="mb-2 h-8 w-8 stroke-[1.5] text-muted-foreground" />
              <p className="text-sm font-medium">No location overrides</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                This product sells at its base price everywhere.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Loyalty points</h3>
            <p className="text-xs text-muted-foreground">
              {product.eligibleForLoyalty
                ? `${loyaltyLabel} — points awarded on qualifying sales.`
                : "Not eligible for tradesperson loyalty points."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {daysSinceCreated !== null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {daysSinceCreated}d old
            </span>
          )}
          <ProductLoyaltyDialog orgId={orgId} product={product}>
            <Button size="sm" variant="outline">
              Manage
            </Button>
          </ProductLoyaltyDialog>
        </div>
      </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <StickyNote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Line notes</h3>
              <p className="text-xs text-muted-foreground">
                {product.needsNotes
                  ? product.notes
                    ? `"${product.notes}" — auto-added to quotation & invoice lines.`
                    : "Automatic notes are enabled for this product."
                  : "No automatic notes on quotation & invoice lines."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ProductNotesDialog orgId={orgId} product={product}>
              <Button size="sm" variant="outline">
                Manage
              </Button>
            </ProductNotesDialog>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shuffle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Alternative products</h3>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const primary = alternatives?.find((a) => a.isPrimary)
                  if (primary) {
                    return `Primary default: ${primary.alternative.name} — ${alternatives?.length ?? 0} alternative${(alternatives?.length ?? 0) === 1 ? "" : "s"} configured.`
                  }
                  if (alternatives && alternatives.length > 0) {
                    return `${alternatives.length} alternative${alternatives.length === 1 ? "" : "s"} configured. No primary default.`
                  }
                  return "Substitute products staff can offer instead of this one."
                })()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ProductAlternativesDialog orgId={orgId} product={product}>
              <Button size="sm" variant="outline">
                Manage
              </Button>
            </ProductAlternativesDialog>
          </div>
        </div>
      </div>
    )
  }

