import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  FolderTree,
  Folder,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { CATEGORY_QUERY_KEYS } from "../../constants"
import { CategoryModal } from "./category-modal"
import { buildCategoryTree } from "../../utils/tree"
import type { Category } from "@repo/contracts"

interface CategoryListProps {
  orgId: string | undefined
}

export function CategoryList({ orgId }: CategoryListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const queryClient = useQueryClient()

  const { data: categories, isLoading } = useQuery(
    orpc.category.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const deleteMutation = useMutation(
    orpc.category.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Category deleted")
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() })
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const tree = buildCategoryTree(categories ?? [])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <FolderTree className="h-5 w-5 text-primary" />
            Categories
          </CardTitle>
          <CardDescription>
            Classify your products into a browseable category tree.
          </CardDescription>
        </div>
        {orgId && (
          <CategoryModal orgId={orgId} categories={categories ?? []}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </CategoryModal>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
            <FolderTree className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No categories found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Add your first category to start classifying your catalog.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                depth={0}
                orgId={orgId ?? ""}
                categories={categories ?? []}
                expanded={expanded}
                onToggle={toggle}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              This will remove the category from your catalog. Categories with
              sub-categories or assigned products cannot be deleted.
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
                  id: deleteTarget.id,
                })
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface CategoryTreeNodeProps {
  node: ReturnType<typeof buildCategoryTree>[number]
  depth: number
  orgId: string
  categories: Category[]
  expanded: Set<string>
  onToggle: (id: string) => void
  onDelete: (category: Category) => void
}

function CategoryTreeNode({
  node,
  depth,
  orgId,
  categories,
  expanded,
  onToggle,
  onDelete,
}: CategoryTreeNodeProps) {
  const isExpanded = expanded.has(node.id)
  const hasChildren = node.children.length > 0

  return (
    <div className="space-y-1">
      <div
        className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-2.5 transition-all hover:bg-muted/60"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => hasChildren && onToggle(node.id)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground ${
              hasChildren ? "cursor-pointer hover:bg-muted" : "cursor-default"
            }`}
            disabled={!hasChildren}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <Folder className="h-4 w-4" />
            )}
          </button>
          <h4 className="truncate text-sm font-medium text-foreground">
            {node.name}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <CategoryModal
                orgId={orgId}
                categories={categories}
                defaultParentId={node.id}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add sub-category
                </DropdownMenuItem>
              </CategoryModal>
              <CategoryModal
                orgId={orgId}
                categories={categories}
                category={node}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </CategoryModal>
              <DropdownMenuItem
                onClick={() => onDelete(node)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              orgId={orgId}
              categories={categories}
              expanded={expanded}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
