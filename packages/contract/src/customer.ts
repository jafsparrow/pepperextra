import { oc } from "@orpc/contract"
import z from "zod"

export const customerTypeSchema = z.enum(["retail", "account", "contractor"])

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
    .refine((v) => v === "" || /^\d+$/.test(v), "Credit limit must be a positive integer (minor units)")
    .optional(),
  paymentTermsDays: z.number().int().optional(),
  vatNumber: z.string().optional(),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
})

export const customerUpdateSchema = customerCreateSchema.partial()

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
