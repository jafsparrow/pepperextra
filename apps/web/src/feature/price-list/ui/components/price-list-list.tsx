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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  ListChecks,
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
import { PRICE_LIST_QUERY_KEYS } from "../../constants"
import { PriceListModal } from "./price-list-modal"

interface PriceListListProps {
  orgId: string | undefined
}

export function PriceListList({ orgId }: PriceListListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: priceLists, isLoading } = useQuery(
    orpc.priceList.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return (priceLists ?? []).filter((pl) => {
      if (!q) return true
      return pl.name.toLowerCase().includes(q)
    })
  }, [priceLists, searchQuery])

  const deleteMutation = useMutation(
    orpc.priceList.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Price list deleted")
        queryClient.invalidateQueries({
          queryKey: PRICE_LIST_QUERY_KEYS.lists(),
        })
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
            <ListChecks className="h-5 w-5 text-primary" />
            Price Lists
          </CardTitle>
          <CardDescription>
            Named price schedules that override sale prices per product.
          </CardDescription>
        </div>
        {orgId && (
          <PriceListModal orgId={orgId}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Price List
            </Button>
          </PriceListModal>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsExpanded(false)
              }}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
            <ListChecks className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No price lists found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria."
                : "Add your first price list to start setting custom prices."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((priceList) => (
              <div
                key={priceList.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-foreground">
                      <Link
                        to="/org/admin/price-lists/$id"
                        params={{ id: priceList.id }}
                        className="transition-colors hover:text-primary"
                      >
                        {priceList.name}
                      </Link>
                    </h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Products without a configured price fall back to the sale
                      price.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <PriceListModal orgId={orgId ?? ""} priceList={priceList}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </PriceListModal>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(priceList.id)}
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
            <DialogTitle>Delete price list</DialogTitle>
            <DialogDescription>
              This will remove the price list and its product prices. This
              action cannot be undone.
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
              {deleteMutation.isPending ? "Deleting..." : "Delete price list"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
