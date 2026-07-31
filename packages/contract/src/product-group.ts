import { oc } from "@orpc/contract"
import z from "zod"

export const productGroupSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  specName: z.string(),
  brandPriority: z.array(z.string()).nullable().optional(),
  stockTrackingMode: z.enum(["group", "sku"]).default("sku"),
  groupReorderThreshold: z.number().int().nullable().optional(),
})

export type ProductGroup = z.infer<typeof productGroupSchema>

export const productGroupCreateSchema = z.object({
  specName: z.string().min(1, "Spec name is required"),
  brandPriority: z.array(z.string()).optional(),
  stockTrackingMode: z.enum(["group", "sku"]).default("sku"),
  groupReorderThreshold: z.number().int().optional(),
})

export const productGroupUpdateSchema = productGroupCreateSchema.partial()

export const listProductGroups = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/product-groups",
  })
  .input(
    z.object({
      organizationId: z.string(),
      teamId: z.string().optional(),
    })
  )
  .output(z.array(productGroupSchema))

export const createProductGroup = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/product-groups",
  })
  .input(
    productGroupCreateSchema.extend({
      organizationId: z.string(),
    })
  )
  .output(productGroupSchema)

export const updateProductGroup = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/product-groups/{id}",
  })
  .input(
    productGroupUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(productGroupSchema)

export const deleteProductGroup = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/product-groups/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))
