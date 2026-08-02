import { useMemo, useState } from "react"
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
import {
  buildCategoryTree,
  collectDescendantIds,
  flattenCategoryTree,
} from "../../utils/tree"
import type { Category } from "@repo/contracts"

interface CategoryModalProps {
  orgId: string
  children?: ReactNode
  categories?: Category[]
  category?: Category
  defaultParentId?: string | null
}

export function CategoryModal({
  orgId,
  children,
  categories = [],
  category,
  defaultParentId = null,
}: CategoryModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() })

  const createMutation = useMutation(
    orpc.category.create.mutationOptions({
      onSuccess: () => {
        toast.success("Category created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.category.update.mutationOptions({
      onSuccess: () => {
        toast.success("Category updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const parentOptions = useMemo(() => {
    const excluded = new Set<string>()
    if (category) {
      excluded.add(category.id)
      const node = findNode(buildCategoryTree(categories), category.id)
      if (node) {
        for (const id of collectDescendantIds(node)) excluded.add(id)
      }
    }
    return flattenCategoryTree(buildCategoryTree(categories)).filter(
      (c) => !excluded.has(c.id)
    )
  }, [categories, category])

  const handleSubmit = (data: CategoryFormValues) => {
    const payload = {
      name: data.name,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
    }

    if (category) {
      updateMutation.mutate({
        organizationId: orgId,
        id: category.id,
        ...payload,
      })
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
          <DialogTitle>
            {category ? "Edit category" : "Add category"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Update this category's details."
              : "Create a new category to classify your products."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          onSubmit={handleSubmit}
          parentOptions={parentOptions}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={category ? "Save changes" : "Create category"}
          defaultValues={
            category
              ? {
                  name: category.name,
                  parentId: category.parentId ?? null,
                  sortOrder: category.sortOrder,
                }
              : { parentId: defaultParentId }
          }
        />
      </DialogContent>
    </Dialog>
  )
}

function findNode(
  nodes: ReturnType<typeof buildCategoryTree>,
  id: string
): ReturnType<typeof buildCategoryTree>[number] | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}
