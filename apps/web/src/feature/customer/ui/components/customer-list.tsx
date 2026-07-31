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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Users,
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
import { formatMoney } from "@/shared/utils/currency"
import { CUSTOMER_QUERY_KEYS, CUSTOMER_TYPE_LABELS } from "../../constants"
import { CustomerModal } from "./customer-modal"

interface CustomerListProps {
  orgId: string | undefined
}

const TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  retail: "outline",
  account: "secondary",
  contractor: "default",
}

export function CustomerList({ orgId }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isExpanded, setIsExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery(
    orpc.customer.list.queryOptions({
      input: { organizationId: orgId ?? "" },
      enabled: !!orgId,
    })
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return (customers ?? []).filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      )
    })
  }, [customers, searchQuery, typeFilter])

  const deleteMutation = useMutation(
    orpc.customer.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Customer deleted")
        queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() })
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
            <Users className="h-5 w-5 text-primary" />
            Customers
          </CardTitle>
          <CardDescription>
            Manage retail, account and contractor customers.
          </CardDescription>
        </div>
        {orgId && (
          <CustomerModal orgId={orgId}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </CustomerModal>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsExpanded(false)
              }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-10 text-center">
            <Users className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No customers found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery || typeFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Add your first customer to start building relationships."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((customer) => (
              <div
                key={customer.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-foreground">
                      {customer.name}
                    </h4>
                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {customer.phone && <span>{customer.phone}</span>}
                      {customer.email && (
                        <span className="hidden items-center gap-1 sm:inline-flex">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={TYPE_VARIANTS[customer.type] ?? "outline"}
                    className="hidden text-xs font-semibold capitalize sm:inline-flex"
                  >
                    {CUSTOMER_TYPE_LABELS[customer.type]}
                  </Badge>
                  {customer.creditLimitMinor && (
                    <span className="hidden text-xs text-muted-foreground tabular-nums lg:inline">
                      Limit {formatMoney(customer.creditLimitMinor)}
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <CustomerModal orgId={orgId ?? ""} customer={customer}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </CustomerModal>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(customer.id)}
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
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              This will remove the customer from your records. This action cannot
              be undone.
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
              {deleteMutation.isPending ? "Deleting..." : "Delete customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
