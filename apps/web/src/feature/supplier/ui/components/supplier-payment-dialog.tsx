import { useState, useEffect, useMemo, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Separator } from "@workspace/ui/components/separator"
import { toast } from "sonner"
import { Banknote, RefreshCw } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { SUPPLIER_QUERY_KEYS } from "../../constants"

interface SupplierPaymentDialogProps {
  orgId: string
  supplierId: string
  supplierName: string
  onClose: () => void
}

interface InvoiceAllocation {
  invoiceId: string
  invoiceNumber: string
  dueDate: string | null | undefined
  outstandingMinor: string
  allocatedMinor: string
  selected: boolean
}

export function SupplierPaymentDialog({
  orgId,
  supplierId,
  supplierName,
  onClose,
}: SupplierPaymentDialogProps) {
  const { format, toMinorUnits } = useCurrency()
  const queryClient = useQueryClient()

  const [method, setMethod] = useState<string>("bank_transfer")
  const [reference, setReference] = useState("")
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])
  const [amountMajor, setAmountMajor] = useState("")
  const [amountMinor, setAmountMinor] = useState("0")
  const [allocations, setAllocations] = useState<InvoiceAllocation[]>([])
  const [step, setStep] = useState<"enter" | "confirm">("enter")

  const { data: invoices, isLoading } = useQuery(
    orpc.supplier.listInvoices.queryOptions({
      input: { organizationId: orgId, id: supplierId },
      enabled: !!orgId && !!supplierId,
    })
  )

  const outstandingInvoices = useMemo(() => {
    return (invoices ?? [])
      .filter((inv) => inv.status !== "paid" && inv.status !== "void")
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }, [invoices])

  const totalOutstandingMinor = useMemo(() => {
    return outstandingInvoices.reduce(
      (sum, inv) => sum + BigInt(inv.outstandingMinor),
      BigInt(0)
    ).toString()
  }, [outstandingInvoices])

  const totalAllocatedMinor = useMemo(() => {
    return allocations
      .filter((a) => a.selected)
      .reduce((sum, a) => sum + BigInt(a.allocatedMinor), BigInt(0))
      .toString()
  }, [allocations])

  const allocateFifo = useCallback(
    (totalAmountMinor: string) => {
      let remaining = BigInt(totalAmountMinor)
      return outstandingInvoices.map((inv) => {
        if (!remaining || remaining <= BigInt(0)) {
          return {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            dueDate: inv.dueDate,
            outstandingMinor: inv.outstandingMinor,
            allocatedMinor: "0",
            selected: true,
          }
        }
        const outstanding = BigInt(inv.outstandingMinor)
        const allocate = remaining >= outstanding ? outstanding : remaining
        remaining = remaining - allocate
        return {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          outstandingMinor: inv.outstandingMinor,
          allocatedMinor: allocate.toString(),
          selected: true,
        }
      })
    },
    [outstandingInvoices]
  )

  useEffect(() => {
    if (amountMinor && BigInt(amountMinor) > BigInt(0)) {
      setAllocations(allocateFifo(amountMinor))
    } else {
      setAllocations(
        outstandingInvoices.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          outstandingMinor: inv.outstandingMinor,
          allocatedMinor: "0",
          selected: false,
        }))
      )
    }
  }, [amountMinor, outstandingInvoices, allocateFifo])

  const handleAmountChange = (value: string) => {
    if (!value || value === ".") {
      setAmountMajor("")
      setAmountMinor("0")
      return
    }

    const cleaned = value.replace(/[^0-9.]/g, "")
    const parts = cleaned.split(".")
    const formatted = parts[0] + (parts.length > 1 ? "." + parts[1] : "")

    setAmountMajor(formatted)
    if (formatted && !isNaN(Number(formatted))) {
      setAmountMinor(toMinorUnits(formatted))
    } else {
      setAmountMinor("0")
    }
  }

  const handleToggleInvoice = (invoiceId: string) => {
    setAllocations((prev) => {
      const updated = prev.map((a) =>
        a.invoiceId === invoiceId ? { ...a, selected: !a.selected } : a
      )

      const selectedAllocations = updated.filter((a) => a.selected)
      if (selectedAllocations.length === 0) {
        return updated.map((a) => ({ ...a, allocatedMinor: "0" }))
      }

      let remaining = BigInt(amountMinor)
      selectedAllocations.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

      const reallocated = updated.map((a) => {
        if (!a.selected) return { ...a, allocatedMinor: "0" }
        if (remaining <= BigInt(0)) return { ...a, allocatedMinor: "0" }
        const outstanding = BigInt(a.outstandingMinor)
        const allocate = remaining >= outstanding ? outstanding : remaining
        remaining = remaining - allocate
        return { ...a, allocatedMinor: allocate.toString() }
      })

      return reallocated
    })
  }

  const createPaymentMutation = useMutation(
    orpc.supplier.createPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment recorded successfully")
        queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.detail(supplierId) })
        queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.invoiceList(orgId, supplierId) })
        queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.paymentList(orgId, supplierId) })
        onClose()
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = () => {
    const effectiveAllocations = allocations
      .filter((a) => a.selected && BigInt(a.allocatedMinor) > BigInt(0))
      .map((a) => ({
        purchaseInvoiceId: a.invoiceId,
        amountMinor: a.allocatedMinor,
      }))

    if (effectiveAllocations.length === 0) {
      toast.error("No invoices selected for payment")
      return
    }

    createPaymentMutation.mutate({
      organizationId: orgId,
      supplierId,
      amountMinor,
      method: method as "cash" | "bank_transfer" | "cheque" | "store_credit",
      reference: reference || undefined,
      paidAt: new Date(paidAt).toISOString(),
      allocations: effectiveAllocations,
    })
  }

  const remaining = (BigInt(amountMinor) - BigInt(totalAllocatedMinor)).toString()
  const hasOverAllocation = BigInt(remaining) < BigInt(0)
  const hasExceededTotalOutstanding = BigInt(amountMinor) > BigInt(totalOutstandingMinor) && BigInt(totalOutstandingMinor) > BigInt(0)
  const canProceed =
    BigInt(amountMinor) > BigInt(0) &&
    !hasOverAllocation &&
    allocations.some((a) => a.selected && BigInt(a.allocatedMinor) > BigInt(0))

  const confirmDisabled = createPaymentMutation.isPending || !canProceed

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                {supplierName} &mdash; Outstanding: {format(totalOutstandingMinor)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "enter" ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference (optional)</Label>
                <Input
                  placeholder="e.g. TXN-001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Total Payment Amount
              </Label>
              <div className="relative">
                <Input
                  placeholder="0.000"
                  value={amountMajor}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="text-lg font-bold tabular-nums h-12 pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  major units
                </div>
              </div>
              {hasExceededTotalOutstanding && (
                <p className="text-xs text-amber-600">
                  Amount exceeds total outstanding ({format(totalOutstandingMinor)}). The excess will create credit on account.
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Invoice Allocation</h4>
                <span className="text-xs text-muted-foreground">
                  Sorted by due date (oldest first)
                </span>
              </div>

              {isLoading ? (
                <div className="h-32 animate-pulse rounded-lg bg-muted/60" />
              ) : allocations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
                  No outstanding invoices to allocate payment to.
                </div>
              ) : (
                <div className="rounded-lg border border-border/40 bg-card/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">To Pay</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allocations.map((alloc) => {
                        const outstanding = BigInt(alloc.outstandingMinor)
                        const toPay = BigInt(alloc.allocatedMinor)
                        const isFullyPaid = alloc.selected && toPay >= outstanding
                        const isPartial = alloc.selected && toPay > BigInt(0) && toPay < outstanding

                        return (
                          <TableRow
                            key={alloc.invoiceId}
                            className={
                              alloc.selected
                                ? "bg-primary/5"
                                : "opacity-60"
                            }
                          >
                            <TableCell>
                              <Checkbox
                                checked={alloc.selected}
                                onCheckedChange={() => handleToggleInvoice(alloc.invoiceId)}
                                aria-label={`Select ${alloc.invoiceNumber}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {alloc.invoiceNumber}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {alloc.dueDate
                                ? new Date(alloc.dueDate).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {format(alloc.outstandingMinor)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {alloc.selected && toPay > BigInt(0)
                                ? format(alloc.allocatedMinor)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {isFullyPaid && (
                                <Badge variant="default" className="text-[10px] font-semibold">
                                  Full
                                </Badge>
                              )}
                              {isPartial && (
                                <Badge variant="secondary" className="text-[10px] font-semibold">
                                  Partial
                                </Badge>
                              )}
                              {!alloc.selected && (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Amount entered: </span>
                <span className="font-semibold tabular-nums">
                  {amountMajor ? format(amountMinor) : "—"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Allocated: </span>
                <span className="font-semibold tabular-nums">
                  {format(totalAllocatedMinor)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Remaining: </span>
                <span
                  className={`font-semibold tabular-nums ${
                    BigInt(remaining) > BigInt(0)
                      ? "text-amber-600"
                      : BigInt(remaining) < BigInt(0)
                        ? "text-destructive"
                        : "text-emerald-600"
                  }`}
                >
                  {format(remaining)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={!canProceed}
                onClick={() => setStep("confirm")}
              >
                Review Allocation
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{method.replace("_", " ")}</span>
              </div>
              {reference && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{reference}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date(paidAt).toLocaleDateString()}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-lg font-bold tabular-nums">
                  {format(amountMinor)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Payment Allocation</h4>
              <div className="rounded-lg border border-border/40 bg-card/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Amount to Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations
                      .filter((a) => a.selected && BigInt(a.allocatedMinor) > BigInt(0))
                      .map((alloc) => (
                        <TableRow key={alloc.invoiceId}>
                          <TableCell className="font-medium">
                            {alloc.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {alloc.dueDate
                              ? new Date(alloc.dueDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {format(alloc.outstandingMinor)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {format(alloc.allocatedMinor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    {allocations.filter((a) => a.selected && BigInt(a.allocatedMinor) > BigInt(0))
                      .length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No invoices selected for payment
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
              <div className="flex items-center gap-1 text-sm">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {BigInt(remaining) > BigInt(0)
                    ? `${format(remaining)} will remain unallocated`
                    : BigInt(remaining) === BigInt(0)
                      ? "All amount is allocated"
                      : "Over-allocated"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("enter")}
                className="text-xs"
              >
                Back
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={confirmDisabled}
                onClick={handleSubmit}
              >
                {createPaymentMutation.isPending
                  ? "Recording..."
                  : "Confirm Payment"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}