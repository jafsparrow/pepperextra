import { oc } from "@orpc/contract"
import z from "zod"

export const productSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productGroupId: z.string().nullable().optional(),
  name: z.string(),
  skuCode: z.string(),
  specCode: z.string().nullable().optional(),
  brandTag: z.string().nullable().optional(),
  basePriceMinor: z.string(),
  unit: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  eligibleForLoyalty: z.boolean().default(false),
  reorderThreshold: z.number().int().nullable().optional(),
})

export type Product = z.infer<typeof productSchema>

export const productCreateSchema = z.object({
  productGroupId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  skuCode: z.string().min(1, "SKU is required"),
  specCode: z.string().optional(),
  brandTag: z.string().optional(),
  basePriceMinor: z.string().refine((v) => /^\d+$/.test(v), "Price must be a positive integer (minor units)"),
  unit: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  eligibleForLoyalty: z.boolean().default(false),
  reorderThreshold: z.number().int().optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export const listProducts = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/products",
  })
  .input(
    z.object({
      organizationId: z.string(),
      teamId: z.string().optional(),
      productGroupId: z.string().optional(),
      search: z.string().optional(),
      brandTag: z.string().optional(),
    })
  )
  .output(z.array(productSchema))

export const createProduct = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/products",
  })
  .input(
    productCreateSchema.extend({
      organizationId: z.string(),
    })
  )
  .output(productSchema)

export const updateProduct = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/products/{id}",
  })
  .input(
    productUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(productSchema)

export const deleteProduct = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/products/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))
