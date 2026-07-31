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
import { PRODUCT_QUERY_KEYS } from "../../constants"
import { ProductForm } from "./product-form"
import type { ProductFormValues } from "../../schema/product-schema"
import type { Product, ProductGroup } from "@repo/contracts"

interface ProductModalProps {
  orgId: string
  children?: ReactNode
  product?: Product
  productGroups?: ProductGroup[]
}

export function ProductModal({ orgId, children, product, productGroups = [] }: ProductModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

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
      productGroupId: data.productGroupId,
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
      eligibleForLoyalty: data.eligibleForLoyalty,
      reorderThreshold:
        data.reorderThreshold === undefined ? undefined : data.reorderThreshold,
    }

    if (product) {
      updateMutation.mutate({ organizationId: orgId, id: product.id, ...payload })
    } else {
      createMutation.mutate({ organizationId: orgId, ...payload })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">{product ? "Edit" : "Add product"}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update this product's details."
              : "Add a new product to your catalog."}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          onSubmit={handleSubmit}
          productGroups={productGroups}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={product ? "Save changes" : "Create product"}
          defaultValues={
            product
              ? {
                  name: product.name,
                  skuCode: product.skuCode,
                  productGroupId: product.productGroupId ?? undefined,
                  specCode: product.specCode ?? "",
                  brandTag: product.brandTag ?? "",
                  basePrice:
                    product.basePriceMinor && product.basePriceMinor !== "0"
                      ? (Number(product.basePriceMinor) / 1000).toString()
                      : "",
                  unit: product.unit ?? "",
                  aliases: product.aliases?.join(", ") ?? "",
                  eligibleForLoyalty: product.eligibleForLoyalty,
                  reorderThreshold: product.reorderThreshold ?? undefined,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
