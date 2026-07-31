import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Truck,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { SUPPLIER_QUERY_KEYS } from "../../constants"
import { SupplierModal } from "./supplier-modal"

interface SupplierListProps {
  orgId: string | undefined
}

export function SupplierList({ orgId }: SupplierListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: suppliers, isLoading } = useQuery(
    orpc.supplier.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return (suppliers ?? []).filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.contactName ?? "").toLowerCase().includes(q) ||
        (s.contactEmail ?? "").toLowerCase().includes(q)
    )
  }, [suppliers, searchQuery])

  const deleteMutation = useMutation(
    orpc.supplier.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier deleted")
        queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.lists() })
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
            <Truck className="h-5 w-5 text-primary" />
            Suppliers
          </CardTitle>
          <CardDescription>
            Manage the vendors you purchase materials from.
          </CardDescription>
        </div>
        {orgId && (
          <SupplierModal orgId={orgId}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </SupplierModal>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsExpanded(false)
            }}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
            <Truck className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No suppliers found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria."
                : "Add your first supplier to start tracking purchases."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((supplier) => (
              <div
                key={supplier.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-foreground">
                      {supplier.name}
                    </h4>
                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {supplier.contactName && <span>{supplier.contactName}</span>}
                      {supplier.contactPhone && <span>· {supplier.contactPhone}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {supplier.contactEmail && (
                    <Badge variant="outline" className="hidden items-center gap-1 text-xs sm:inline-flex">
                      <Mail className="h-3 w-3" />
                      {supplier.contactEmail}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <SupplierModal orgId={orgId ?? ""} supplier={supplier}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </SupplierModal>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(supplier.id)}
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

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete supplier</DialogTitle>
            <DialogDescription>
              This will remove the supplier from your vendor list. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget &&
                deleteMutation.mutate({ organizationId: orgId ?? "", id: deleteTarget })
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete supplier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
