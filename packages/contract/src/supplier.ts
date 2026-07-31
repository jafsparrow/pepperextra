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
