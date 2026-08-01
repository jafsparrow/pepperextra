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
import { Receipt } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active: "secondary",
  paid: "default",
  partially_credited: "outline",
  fully_credited: "outline",
  void: "outline",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paid: "Paid",
  partially_credited: "Partially credited",
  fully_credited: "Fully credited",
  void: "Void",
}

interface CustomerInvoicesProps {
  orgId: string
  customerId: string
}

export function CustomerInvoices({
  orgId,
  customerId,
}: CustomerInvoicesProps) {
  const { format } = useCurrency()

  const { data: invoices, isLoading } = useQuery(
    orpc.customer.listInvoices.queryOptions({
      input: { organizationId: orgId, id: customerId },
      enabled: !!orgId && !!customerId,
    })
  )

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Receipt className="h-5 w-5 text-primary" />
          Invoices
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading invoices..."
            : `${invoices?.length ?? 0} invoice(s) on this customer's account.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/60" />
        ) : !invoices || invoices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            No invoices on this account yet.
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
                <TableHead className="text-right">Outstanding</TableHead>
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
                  <TableCell
                    className={
                      invoice.outstandingMinor !== "0"
                        ? "text-right font-semibold tabular-nums text-destructive"
                        : "text-right tabular-nums text-muted-foreground"
                    }
                  >
                    {format(invoice.outstandingMinor)}
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
