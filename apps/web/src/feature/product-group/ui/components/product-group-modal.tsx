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
import { PRODUCT_GROUP_QUERY_KEYS } from "../../constants"
import { ProductGroupForm } from "./product-group-form"
import type { ProductGroupFormValues } from "../../schema/product-group-schema"
import type { ProductGroup } from "@repo/contracts"

interface ProductGroupModalProps {
  orgId: string
  children?: ReactNode
  group?: ProductGroup
}

export function ProductGroupModal({
  orgId,
  children,
  group,
}: ProductGroupModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: PRODUCT_GROUP_QUERY_KEYS.lists(),
    })

  const createMutation = useMutation(
    orpc.productGroup.create.mutationOptions({
      onSuccess: () => {
        toast.success("Product group created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.productGroup.update.mutationOptions({
      onSuccess: () => {
        toast.success("Product group updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: ProductGroupFormValues) => {
    const payload = {
      specName: data.specName,
      stockTrackingMode: data.stockTrackingMode,
      groupReorderThreshold:
        data.groupReorderThreshold === undefined
          ? undefined
          : data.groupReorderThreshold,
    }

    if (group) {
      updateMutation.mutate({ organizationId: orgId, id: group.id, ...payload })
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
          <Button type="button">{group ? "Edit" : "Add product group"}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {group ? "Edit product group" : "Add product group"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Update this product group's details."
              : "Create a new product group to organize equivalent products."}
          </DialogDescription>
        </DialogHeader>
        <ProductGroupForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={group ? "Save changes" : "Create product group"}
          defaultValues={
            group
              ? {
                  specName: group.specName,
                  stockTrackingMode: group.stockTrackingMode,
                  groupReorderThreshold:
                    group.groupReorderThreshold ?? undefined,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
