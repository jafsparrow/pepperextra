import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { ArrowLeft, Pencil, Users, Mail, Phone, MapPin, FileText } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"
import { useCurrency } from "@/shared/org/use-currency"
import { CUSTOMER_TYPE_LABELS } from "../../constants"
import { CustomerModal } from "./customer-modal"
import { FinancialSummary } from "./financial-summary"
import { CustomerInvoices } from "./customer-invoices"
import { CustomerPayments } from "./customer-payments"
import { CustomerCreditNotes } from "./customer-credit-notes"
import { CustomerWarrantyClaims } from "./customer-warranty-claims"
import { CustomerSites } from "./customer-sites"

interface CustomerDetailsProps {
  orgId: string
  customerId: string
}

export function CustomerDetails({ orgId, customerId }: CustomerDetailsProps) {
  const { format } = useCurrency()

  const { data: customer, isLoading } = useQuery(
    orpc.customer.get.queryOptions({
      input: { organizationId: orgId, id: customerId },
      enabled: !!orgId && !!customerId,
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

  if (!customer) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-center">
        <p className="text-sm font-medium">Customer not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/org/admin/customers">Back to customers</Link>
        </Button>
      </div>
    )
  }

  const detailItems = [
    { label: "Phone", value: customer.phone },
    { label: "Email", value: customer.email },
    { label: "Credit limit", value: customer.creditLimitMinor },
    { label: "Payment terms", value: customer.paymentTermsDays },
    { label: "VAT number", value: customer.vatNumber },
    { label: "Billing address", value: customer.billingAddress },
    { label: "Shipping address", value: customer.shippingAddress },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
          <Link to="/org/admin/customers">
            <ArrowLeft className="h-4 w-4" />
            Customers
          </Link>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-muted/20 p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  {customer.name}
                </h1>
                <Badge className="text-[11px] font-semibold capitalize">
                  {CUSTOMER_TYPE_LABELS[customer.type]}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                )}
                {customer.billingAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.billingAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          <CustomerModal orgId={orgId} customer={customer}>
            <Button size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit metadata
            </Button>
          </CustomerModal>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {detailItems.map((item) => {
            let display: string | null =
              item.value === undefined || item.value === null || item.value === ""
                ? null
                : String(item.value)
            if (display === null) {
              return (
                <div key={item.label}>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    —
                  </p>
                </div>
              )
            }
            if (item.label === "Credit limit") {
              display = format(display)
            } else if (item.label === "Payment terms") {
              display = `${display} days`
            }
            return (
              <div key={item.label}>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {display}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <FinancialSummary summary={customer.financialSummary} />

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit notes</TabsTrigger>
          <TabsTrigger value="warranty">Warranty claims</TabsTrigger>
          <TabsTrigger value="sites">
            Sites
            {customer.sites.length > 0 && ` (${customer.sites.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <CustomerInvoices orgId={orgId} customerId={customerId} />
        </TabsContent>
        <TabsContent value="payments">
          <CustomerPayments orgId={orgId} customerId={customerId} />
        </TabsContent>
        <TabsContent value="credit-notes">
          <CustomerCreditNotes orgId={orgId} customerId={customerId} />
        </TabsContent>
        <TabsContent value="warranty">
          <CustomerWarrantyClaims orgId={orgId} customerId={customerId} />
        </TabsContent>
        <TabsContent value="sites">
          <CustomerSites
            orgId={orgId}
            customerId={customerId}
            customerType={customer.type}
          />
        </TabsContent>
      </Tabs>

      {customer.notes && (
        <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-card/60 p-4 text-sm text-muted-foreground">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
          <span>{customer.notes}</span>
        </div>
      )}
    </div>
  )
}
