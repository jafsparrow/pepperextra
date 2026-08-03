import { useQuery } from "@tanstack/react-query"
import { X, Package } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
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

interface PurchaseInvoiceDetailDialogProps {
  orgId: string
  supplierId: string
  invoiceId: string | null
  onClose: () => void
}

export function PurchaseInvoiceDetailDialog({
  orgId,
  supplierId,
  invoiceId,
  onClose,
}: PurchaseInvoiceDetailDialogProps) {
  const { format } = useCurrency()

  const { data: invoice, isLoading } = useQuery(
    orpc.supplier.getInvoice.queryOptions({
      input: { organizationId: orgId, supplierId, invoiceId: invoiceId! },
      enabled: !!orgId && !!supplierId && !!invoiceId,
    })
  )

  if (!invoiceId) {
    return null
  }

  const hasTaxBreakdown = (value: unknown): value is Record<string, number> =>
    !!value && typeof value === "object"

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold">
                Purchase Invoice Details
              </DialogTitle>
              <CardDescription>
                View line items and details for this purchase invoice
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted/60" />
            <div className="h-24 w-full animate-pulse rounded bg-muted/60" />
          </div>
        ) : invoice ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Invoice Number
                </p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </p>
                <Badge
                  variant={STATUS_VARIANTS[invoice.status] ?? "outline"}
                  className="text-[10px] font-semibold capitalize"
                >
                  {STATUS_LABELS[invoice.status] ?? invoice.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Issued Date
                </p>
                <p className="font-medium">
                  {new Date(invoice.issuedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Due Date
                </p>
                <p className="font-medium">
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Subtotal
                </p>
                <p className="font-medium tabular-nums">{format(invoice.subtotalMinor)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tax Total
                </p>
                <p className="font-medium tabular-nums">{format(invoice.taxTotalMinor)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Grand Total
                </p>
                <p className="text-xl font-black tabular-nums text-primary">
                  {format(invoice.grandTotalMinor)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Paid Amount
                </p>
                <p className="font-medium tabular-nums text-emerald-600">
                  {format(invoice.paidMinor)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Outstanding
                </p>
                <p className="font-medium tabular-nums text-destructive">
                  {format(invoice.outstandingMinor)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Line Items ({invoice.lines.length})
              </h4>
              <Card className="border border-border/40 bg-card/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lines.map((line, index) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-center text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{line.description ?? "—"}</div>
                          {hasTaxBreakdown(line.taxBreakdown) &&
                            Object.keys(line.taxBreakdown).length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Tax:{" "}
                                {Object.entries(line.taxBreakdown)
                                  .map(([rate, amount]) => `${rate}: ${format(amount.toString())}`)
                                  .join(", ")}
                              </div>
                            )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {format(line.unitCostMinor)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {format(line.lineTotalMinor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {hasTaxBreakdown(invoice.taxBreakdown) &&
              Object.keys(invoice.taxBreakdown).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Tax Breakdown</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(invoice.taxBreakdown).map(([rate, amount]) => (
                      <div key={rate} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax {rate}</span>
                        <span className="font-medium tabular-nums">
                          {format(amount.toString())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Invoice not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}