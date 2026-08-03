import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { FileText, Eye } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "secondary",
  paid: "default",
  partially_credited: "outline",
  fully_credited: "outline",
  void: "destructive",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paid: "Paid",
  partially_credited: "Partially Credited",
  fully_credited: "Fully Credited",
  void: "Void",
}

interface SupplierInvoicesProps {
  orgId: string
  supplierId: string
  onViewInvoice?: (invoiceId: string) => void
}

export function SupplierInvoices({ orgId, supplierId, onViewInvoice }: SupplierInvoicesProps) {
  const { format } = useCurrency()

  const { data: invoices, isLoading } = useQuery(
    orpc.supplier.listInvoices.queryOptions({
      input: { organizationId: orgId, id: supplierId },
      enabled: !!orgId && !!supplierId,
    })
  )

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <FileText className="h-5 w-5 text-primary" />
          Purchase Invoices
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading invoices..."
            : `${invoices?.length ?? 0} invoice(s) from this supplier.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/60" />
        ) : !invoices || invoices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            No purchase invoices from this supplier yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANTS[invoice.status] ?? "outline"}
                      className="text-[10px] font-semibold capitalize"
                    >
                      {STATUS_LABELS[invoice.status] ?? invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {format(invoice.grandTotalMinor)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {format(invoice.paidMinor)}
                  </TableCell>
                  <TableCell
                    className={
                      invoice.outstandingMinor !== "0"
                        ? "text-right font-semibold tabular-nums text-destructive"
                        : "text-right tabular-nums text-muted-foreground"
                    }
                  >
                    {format(invoice.outstandingMinor)}
                  </TableCell>
                  <TableCell className="text-right">
                    {onViewInvoice && (
                      <button
                        onClick={() => onViewInvoice(invoice.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}