import { oc } from "@orpc/contract"
import z from "zod"

export const productImageSchema = z.object({
  id: z.string(),
  productId: z.string(),
  organizationId: z.string(),
  imageUrl: z.string(),
  storageKey: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
  altText: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  createdAt: z.string().datetime().nullable().optional(),
})

export type ProductImage = z.infer<typeof productImageSchema>

export const productLocationOverrideSchema = z.object({
  teamId: z.string(),
  teamName: z.string().nullable().optional(),
  priceOverrideMinor: z.string().nullable().optional(),
})

export type ProductLocationOverride = z.infer<
  typeof productLocationOverrideSchema
>

export const productStockSchema = z.object({
  teamId: z.string(),
  teamName: z.string().nullable().optional(),
  quantity: z.string(),
})

export type ProductStock = z.infer<typeof productStockSchema>

export const loyaltyPointsConfigSchema = z.object({
  mode: z.enum(["none", "fixed", "price_percent"]).default("none"),
  value: z.number().int().min(0).nullable().optional(),
})

export type LoyaltyPointsConfig = z.infer<typeof loyaltyPointsConfigSchema>

export const productSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productGroupId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  name: z.string(),
  skuCode: z.string(),
  specCode: z.string().nullable().optional(),
  brandTag: z.string().nullable().optional(),
  basePriceMinor: z.string(),
  unit: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  eligibleForLoyalty: z.boolean().default(false),
  loyaltyPoints: loyaltyPointsConfigSchema,
  reorderThreshold: z.number().int().nullable().optional(),
  needsNotes: z.boolean().default(false),
  notes: z.string().nullable().optional(),
})

export type Product = z.infer<typeof productSchema>

export const productDetailSchema = productSchema.extend({
  activeCostPriceMinor: z.string().nullable().optional(),
  costLastUpdated: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().nullable().optional(),
  productGroup: z
    .object({
      specName: z.string(),
      stockTrackingMode: z.enum(["group", "sku"]).default("sku"),
      groupReorderThreshold: z.number().int().nullable().optional(),
    })
    .nullable()
    .optional(),
  categoryName: z.string().nullable().optional(),
  images: z.array(productImageSchema).optional(),
  stock: z.array(productStockSchema).optional(),
  stockTotal: z.string().optional(),
  locationOverrides: z.array(productLocationOverrideSchema).optional(),
})

export type ProductDetail = z.infer<typeof productDetailSchema>

export const productCreateSchema = z.object({
  productGroupId: z.string().optional(),
  categoryId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  skuCode: z.string().min(1, "SKU is required"),
  specCode: z.string().optional(),
  brandTag: z.string().optional(),
  basePriceMinor: z
    .string()
    .refine(
      (v) => /^\d+$/.test(v),
      "Price must be a positive integer (minor units)"
    ),
  unit: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  eligibleForLoyalty: z.boolean().default(false),
  loyaltyPoints: loyaltyPointsConfigSchema.optional(),
  reorderThreshold: z.number().int().optional(),
  needsNotes: z.boolean().default(false),
  notes: z.string().optional(),
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

export const getProduct = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/products/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(productDetailSchema)

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
