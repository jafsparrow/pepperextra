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
import { Badge } from "@workspace/ui/components/badge"
import { FileMinus } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"

const REASON_LABELS: Record<string, string> = {
  customer_return: "Customer return",
  warranty_claim: "Warranty claim",
  reissue_remaining: "Reissue remaining",
  pricing_error: "Pricing error",
  other: "Other",
}

interface CustomerCreditNotesProps {
  orgId: string
  customerId: string
}

export function CustomerCreditNotes({
  orgId,
  customerId,
}: CustomerCreditNotesProps) {
  const { format } = useCurrency()

  const { data: creditNotes, isLoading } = useQuery(
    orpc.customer.listCreditNotes.queryOptions({
      input: { organizationId: orgId, id: customerId },
      enabled: !!orgId && !!customerId,
    })
  )

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <FileMinus className="h-5 w-5 text-primary" />
          Credit notes
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading credit notes..."
            : `${creditNotes?.length ?? 0} credit note(s) on this account.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/60" />
        ) : !creditNotes || creditNotes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            No credit notes issued.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit note</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">
                    {note.creditNoteNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {note.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {REASON_LABELS[note.reason] ?? note.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {format(note.grandTotalMinor)}
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
