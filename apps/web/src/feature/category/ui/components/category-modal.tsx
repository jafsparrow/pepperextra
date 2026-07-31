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
import { CATEGORY_QUERY_KEYS } from "../../constants"
import { CategoryForm } from "./category-form"
import type { CategoryFormValues } from "../../schema/category-schema"
import type { ProductGroup } from "@repo/contracts"

interface CategoryModalProps {
  orgId: string
  children?: ReactNode
  category?: ProductGroup
}

export function CategoryModal({ orgId, children, category }: CategoryModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() })

  const createMutation = useMutation(
    orpc.productGroup.create.mutationOptions({
      onSuccess: () => {
        toast.success("Category created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.productGroup.update.mutationOptions({
      onSuccess: () => {
        toast.success("Category updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: CategoryFormValues) => {
    const payload = {
      specName: data.specName,
      brandPriority: data.brandPriority
        ? data.brandPriority
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : [],
      stockTrackingMode: data.stockTrackingMode,
      groupReorderThreshold:
        data.groupReorderThreshold === undefined
          ? undefined
          : data.groupReorderThreshold,
    }

    if (category) {
      updateMutation.mutate({ organizationId: orgId, id: category.id, ...payload })
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
          <Button type="button">{category ? "Edit" : "Add category"}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Update this category's details."
              : "Create a new category to organize your products."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={category ? "Save changes" : "Create category"}
          defaultValues={
            category
              ? {
                  specName: category.specName,
                  brandPriority: category.brandPriority?.join(", ") ?? "",
                  stockTrackingMode: category.stockTrackingMode,
                  groupReorderThreshold:
                    category.groupReorderThreshold ?? undefined,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
