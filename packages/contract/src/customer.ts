import { oc } from "@orpc/contract"
import z from "zod"

export const customerTypeSchema = z.enum(["retail", "account", "contractor"])

export const siteStatusSchema = z.enum([
  "active",
  "on_hold",
  "completed",
  "cancelled",
])

export const customerSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: customerTypeSchema,
  name: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  creditLimitMinor: z.string().nullable().optional(),
  paymentTermsDays: z.number().int().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  portalLogin: z.boolean().nullable().optional(),
  taxExempt: z.boolean().nullable().optional(),
  defaultPriceListId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type Customer = z.infer<typeof customerSchema>

export const customerCreateSchema = z.object({
  type: customerTypeSchema,
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  creditLimitMinor: z
    .string()
    .refine(
      (v) => v === "" || /^\d+$/.test(v),
      "Credit limit must be a positive integer (minor units)"
    )
    .optional(),
  paymentTermsDays: z.number().int().optional(),
  vatNumber: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  portalLogin: z.boolean().optional(),
  taxExempt: z.boolean().optional(),
  defaultPriceListId: z.string().optional(),
  notes: z.string().optional(),
})

export const customerUpdateSchema = customerCreateSchema.partial()

export const customerSiteSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  customerId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contactNumber: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  expectedEndDate: z.string().nullable().optional(),
  status: siteStatusSchema,
  contacts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      phone: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      role: z.string().nullable().optional(),
      isPrimary: z.boolean(),
    })
  ),
})

export type CustomerSite = z.infer<typeof customerSiteSchema>

export const customerSiteManagerSchema = z.object({
  name: z.string().min(1, "Site manager name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
})

export const customerSiteCreateSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  status: siteStatusSchema.optional(),
  managers: z.array(customerSiteManagerSchema).optional(),
})

export const customerSiteUpdateSchema = customerSiteCreateSchema.partial()

export const customerFinancialSummarySchema = z.object({
  totalBilledMinor: z.string(),
  totalPaidMinor: z.string(),
  totalCreditedMinor: z.string(),
  outstandingMinor: z.string(),
  overdueMinor: z.string(),
  invoiceCount: z.number().int(),
  openInvoiceCount: z.number().int(),
  overdueInvoiceCount: z.number().int(),
  creditLimitMinor: z.string().nullable(),
  creditRemainingMinor: z.string().nullable(),
})

export type CustomerFinancialSummary = z.infer<
  typeof customerFinancialSummarySchema
>

export const customerDetailsSchema = customerSchema.extend({
  financialSummary: customerFinancialSummarySchema,
  sites: z.array(customerSiteSchema),
})

export type CustomerDetails = z.infer<typeof customerDetailsSchema>

export const customerInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  status: z.string(),
  issuedAt: z.string(),
  dueDate: z.string().nullable().optional(),
  grandTotalMinor: z.string(),
  paidMinor: z.string(),
  creditedMinor: z.string(),
  outstandingMinor: z.string(),
  siteId: z.string().nullable().optional(),
})

export type CustomerInvoice = z.infer<typeof customerInvoiceSchema>

export const customerPaymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  amountMinor: z.string(),
  method: z.string(),
  reference: z.string().nullable().optional(),
  paidAt: z.string(),
})

export type CustomerPayment = z.infer<typeof customerPaymentSchema>

export const customerCreditNoteSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  creditNoteNumber: z.string(),
  reason: z.string(),
  grandTotalMinor: z.string(),
  createdAt: z.string(),
})

export type CustomerCreditNote = z.infer<typeof customerCreditNoteSchema>

export const customerWarrantyClaimSchema = z.object({
  id: z.string(),
  claimDate: z.string(),
  claimType: z.string(),
  resolution: z.string().nullable().optional(),
  serviceStatus: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  warrantyName: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
})

export type CustomerWarrantyClaim = z.infer<typeof customerWarrantyClaimSchema>

export const listCustomers = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers",
  })
  .input(
    z.object({
      organizationId: z.string(),
      teamId: z.string().optional(),
      type: customerTypeSchema.optional(),
      search: z.string().optional(),
    })
  )
  .output(z.array(customerSchema))

export const createCustomer = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/customers",
  })
  .input(
    customerCreateSchema.extend({
      organizationId: z.string(),
    })
  )
  .output(customerSchema)

export const updateCustomer = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/customers/{id}",
  })
  .input(
    customerUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(customerSchema)

export const deleteCustomer = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/customers/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))

export const getCustomer = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(customerDetailsSchema)

export const listCustomerInvoices = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers/{id}/invoices",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(customerInvoiceSchema))

export const listCustomerPayments = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers/{id}/payments",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(customerPaymentSchema))

export const listCustomerCreditNotes = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers/{id}/credit-notes",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(customerCreditNoteSchema))

export const listCustomerWarrantyClaims = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers/{id}/warranty-claims",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(customerWarrantyClaimSchema))

export const listCustomerSites = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/customers/{id}/sites",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.array(customerSiteSchema))

export const createCustomerSite = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/customers/{customerId}/sites",
  })
  .input(
    customerSiteCreateSchema.extend({
      organizationId: z.string(),
      customerId: z.string(),
    })
  )
  .output(customerSiteSchema)

export const updateCustomerSite = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/customers/{customerId}/sites/{siteId}",
  })
  .input(
    customerSiteUpdateSchema.extend({
      organizationId: z.string(),
      customerId: z.string(),
      siteId: z.string(),
    })
  )
  .output(customerSiteSchema)

export const deleteCustomerSite = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/customers/{customerId}/sites/{siteId}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      customerId: z.string(),
      siteId: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))
