import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { ArrowLeft, Pencil, Truck, Mail, Phone, CalendarDays, Plus } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { SupplierModal } from "./supplier-modal"
import { SupplierFinancialSummary } from "./supplier-financial-summary"
import { SupplierInvoices } from "./supplier-invoices"
import { SupplierPayments } from "./supplier-payments"
import { PurchaseInvoiceDetailDialog } from "./purchase-invoice-detail-dialog"
import { SupplierPaymentDialog } from "./supplier-payment-dialog"

interface SupplierDetailsProps {
  orgId: string
  supplierId: string
}

export function SupplierDetails({ orgId, supplierId }: SupplierDetailsProps) {
  const [invoiceDetailId, setInvoiceDetailId] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const { data: supplier, isLoading } = useQuery(
    orpc.supplier.get.queryOptions({
      input: { organizationId: orgId, id: supplierId },
      enabled: !!orgId && !!supplierId,
    })
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 w-full animate-pulse rounded-2xl bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-center">
        <p className="text-sm font-medium">Supplier not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/org/admin/suppliers">Back to suppliers</Link>
        </Button>
      </div>
    )
  }

  const detailItems = [
    { label: "Contact Name", value: supplier.contactName },
    { label: "Phone", value: supplier.contactPhone },
    { label: "Email", value: supplier.contactEmail },
    {
      label: "Payment Terms",
      value: supplier.paymentTermsDays != null ? `${supplier.paymentTermsDays} days` : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
          <Link to="/org/admin/suppliers">
            <ArrowLeft className="h-4 w-4" />
            Suppliers
          </Link>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-muted/20 p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground">
                {supplier.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {supplier.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {supplier.contactPhone}
                  </span>
                )}
                {supplier.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {supplier.contactEmail}
                  </span>
                )}
                {supplier.paymentTermsDays != null && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {supplier.paymentTermsDays} day terms
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SupplierModal orgId={orgId} supplier={supplier}>
              <Button size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </SupplierModal>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {detailItems.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {item.value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SupplierFinancialSummary summary={supplier.financialSummary} />

      <Tabs defaultValue="invoices">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices">Purchase Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setPaymentDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
        <TabsContent value="invoices">
          <SupplierInvoices
            orgId={orgId}
            supplierId={supplierId}
            onViewInvoice={setInvoiceDetailId}
          />
        </TabsContent>
        <TabsContent value="payments">
          <SupplierPayments orgId={orgId} supplierId={supplierId} />
        </TabsContent>
      </Tabs>

      {invoiceDetailId && (
        <PurchaseInvoiceDetailDialog
          orgId={orgId}
          supplierId={supplierId}
          invoiceId={invoiceDetailId}
          onClose={() => setInvoiceDetailId(null)}
        />
      )}

      {paymentDialogOpen && (
        <SupplierPaymentDialog
          orgId={orgId}
          supplierId={supplierId}
          supplierName={supplier.name}
          onClose={() => setPaymentDialogOpen(false)}
        />
      )}
    </div>
  )
}