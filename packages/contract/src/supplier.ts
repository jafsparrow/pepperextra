import { oc } from "@orpc/contract"
import z from "zod"

export const supplierSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  paymentTermsDays: z.number().int().nullable().optional(),
})

export type Supplier = z.infer<typeof supplierSchema>

export const supplierCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional(),
  paymentTermsDays: z.number().int().optional(),
})

export const supplierUpdateSchema = supplierCreateSchema.partial()

export const supplierFinancialSummarySchema = z.object({
  totalBilledMinor: z.string(),
  totalPaidMinor: z.string(),
  totalCreditedMinor: z.string(),
  outstandingMinor: z.string(),
  overdueMinor: z.string(),
  invoiceCount: z.number().int(),
  openInvoiceCount: z.number().int(),
  overdueInvoiceCount: z.number().int(),
})

export type SupplierFinancialSummary = z.infer<typeof supplierFinancialSummarySchema>

export const supplierDetailsSchema = supplierSchema.extend({
  financialSummary: supplierFinancialSummarySchema,
})

export type SupplierDetails = z.infer<typeof supplierDetailsSchema>

export const purchaseInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  status: z.string(),
  issuedAt: z.string(),
  dueDate: z.string().nullable().optional(),
  grandTotalMinor: z.string(),
  paidMinor: z.string(),
  creditedMinor: z.string(),
  outstandingMinor: z.string(),
})

export type PurchaseInvoice = z.infer<typeof purchaseInvoiceSchema>

export const purchaseInvoiceLineSchema = z.object({
  id: z.string(),
  description: z.string().nullable().optional(),
  quantity: z.string(),
  unitCostMinor: z.string(),
  lineTotalMinor: z.string(),
  taxBreakdown: z.unknown(),
})

export type PurchaseInvoiceLine = z.infer<typeof purchaseInvoiceLineSchema>

export const purchaseInvoiceDetailSchema = purchaseInvoiceSchema.extend({
  lines: z.array(purchaseInvoiceLineSchema),
  subtotalMinor: z.string(),
  taxTotalMinor: z.string(),
  taxBreakdown: z.unknown(),
})

export type PurchaseInvoiceDetail = z.infer<typeof purchaseInvoiceDetailSchema>

export const supplierPaymentSchema = z.object({
  id: z.string(),
  purchaseInvoiceId: z.string(),
  invoiceNumber: z.string(),
  amountMinor: z.string(),
  method: z.string(),
  reference: z.string().nullable().optional(),
  paidAt: z.string(),
})

export type SupplierPayment = z.infer<typeof supplierPaymentSchema>

export const supplierPaymentAllocationSchema = z.object({
  purchaseInvoiceId: z.string(),
  amountMinor: z.string(),
})

export const createSupplierPaymentInputSchema = z.object({
  organizationId: z.string(),
  supplierId: z.string(),
  amountMinor: z.string(),
  method: z.enum(["cash", "bank_transfer", "cheque", "store_credit"]),
  reference: z.string().optional(),
  paidAt: z.string(),
  allocations: z.array(supplierPaymentAllocationSchema),
})

export const listSuppliers = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/suppliers",
  })
  .input(
    z.object({
      organizationId: z.string(),
      teamId: z.string().optional(),
      search: z.string().optional(),
    })
  )
  .output(z.array(supplierSchema))

export const createSupplier = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/suppliers",
  })
  .input(
    supplierCreateSchema.extend({
      organizationId: z.string(),
    })
  )
  .output(supplierSchema)

export const updateSupplier = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/suppliers/{id}",
  })
  .input(
    supplierUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(supplierSchema)

export const deleteSupplier = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/suppliers/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))

export const getSupplier = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/suppliers/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(supplierDetailsSchema)

export const listSupplierInvoices = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/suppliers/{id}/invoices",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(purchaseInvoiceSchema))

export const getSupplierInvoice = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/suppliers/{supplierId}/invoices/{invoiceId}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      supplierId: z.string(),
      invoiceId: z.string(),
    })
  )
  .output(purchaseInvoiceDetailSchema)

export const listSupplierPayments = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/suppliers/{id}/payments",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(supplierPaymentSchema))

export const createSupplierPayment = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/suppliers/{supplierId}/payments",
  })
  .input(createSupplierPaymentInputSchema)
  .output(z.array(supplierPaymentSchema))