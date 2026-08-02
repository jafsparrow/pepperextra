import { useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { toMinorUnits } from "@/shared/utils/currency"
import { useCurrency } from "@/shared/org/use-currency"
import { PRODUCT_QUERY_KEYS } from "../../constants"
import { ProductForm } from "./product-form"
import type { ProductFormValues } from "../../schema/product-schema"
import type { Product, Category } from "@repo/contracts"

interface ProductModalProps {
  orgId: string
  children?: ReactNode
  product?: Product
  prefill?: Product
  categories?: Category[]
}

export function ProductModal({
  orgId,
  children,
  product,
  prefill,
  categories = [],
}: ProductModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { fromMinorUnits } = useCurrency()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() })

  const createMutation = useMutation(
    orpc.product.create.mutationOptions({
      onSuccess: () => {
        toast.success("Product created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.product.update.mutationOptions({
      onSuccess: () => {
        toast.success("Product updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: ProductFormValues) => {
    const payload = {
      name: data.name,
      skuCode: data.skuCode,
      categoryId: data.categoryId,
      specCode: data.specCode || undefined,
      brandTag: data.brandTag || undefined,
      basePriceMinor:
        data.basePrice && data.basePrice !== ""
          ? toMinorUnits(data.basePrice)
          : "0",
      unit: data.unit || undefined,
      aliases: data.aliases
        ? data.aliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        : [],
      eligibleForLoyalty: data.eligibleForLoyalty ?? false,
      loyaltyPoints: {
        mode: data.eligibleForLoyalty
          ? (data.loyaltyPointsMode ?? "none")
          : "none",
        value: data.loyaltyPointsValue,
      },
      reorderThreshold:
        data.reorderThreshold === undefined ? undefined : data.reorderThreshold,
    }

    if (product) {
      updateMutation.mutate({
        organizationId: orgId,
        id: product.id,
        ...payload,
      })
    } else {
      createMutation.mutate({ organizationId: orgId, ...payload })
    }
  }

  const base = product ?? prefill

  const basePriceMinor =
    base && base.basePriceMinor && base.basePriceMinor !== "0"
      ? fromMinorUnits(base.basePriceMinor).toFixed()
      : ""

  const title = product ? "Edit product" : prefill ? "Create product from" : "Add product"
  const description = product
    ? "Update this product's details."
    : prefill
      ? "Start a new product with details copied from an existing one."
      : "Add a new product to your catalog."
  const submitLabel = product
    ? "Save changes"
    : prefill
      ? "Create product"
      : "Create product"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">{title}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ProductForm
          onSubmit={handleSubmit}
          categories={categories}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={submitLabel}
          defaultValues={
            base
              ? {
                  name: product ? base.name : "",
                  skuCode: product ? base.skuCode : "",
                  categoryId: base.categoryId ?? undefined,
                  specCode: base.specCode ?? "",
                  brandTag: base.brandTag ?? "",
                  basePrice: basePriceMinor,
                  unit: base.unit ?? "",
                  aliases: base.aliases?.join(", ") ?? "",
                  eligibleForLoyalty: base.eligibleForLoyalty,
                  loyaltyPointsMode: base.loyaltyPoints.mode,
                  loyaltyPointsValue: base.loyaltyPoints.value ?? undefined,
                  reorderThreshold: base.reorderThreshold ?? undefined,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
