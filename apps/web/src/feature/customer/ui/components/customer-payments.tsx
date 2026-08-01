import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Banknote } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"

interface CustomerPaymentsProps {
  orgId: string
  customerId: string
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  store_credit: "Store credit",
}

export function CustomerPayments({
  orgId,
  customerId,
}: CustomerPaymentsProps) {
  const { format } = useCurrency()

  const { data: payments, isLoading } = useQuery(
    orpc.customer.listPayments.queryOptions({
      input: { organizationId: orgId, id: customerId },
      enabled: !!orgId && !!customerId,
    })
  )

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Banknote className="h-5 w-5 text-primary" />
          Payments
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading payments..."
            : `${payments?.length ?? 0} payment(s) recorded against this account.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/60" />
        ) : !payments || payments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(payment.paidAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.invoiceNumber}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {METHOD_LABELS[payment.method] ?? payment.method}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {format(payment.amountMinor)}
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
