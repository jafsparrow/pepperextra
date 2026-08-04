import { oc } from "@orpc/contract"
import z from "zod"

export const priceListSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
})

export type PriceList = z.infer<typeof priceListSchema>

export const priceListOverrideSchema = z.object({
  id: z.string(),
  priceListId: z.string(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  skuCode: z.string().nullable().optional(),
  basePriceMinor: z.string().nullable().optional(),
  priceMinor: z.string(),
})

export type PriceListOverride = z.infer<typeof priceListOverrideSchema>

export const priceListDetailSchema = priceListSchema.extend({
  overrideCount: z.number().int(),
  overrides: z.array(priceListOverrideSchema),
})

export type PriceListDetail = z.infer<typeof priceListDetailSchema>

export const priceListCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export const priceListUpdateSchema = priceListCreateSchema.partial()

export const priceListOverrideCreateSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  priceMinor: z
    .string()
    .refine(
      (v) => /^\d+$/.test(v),
      "Price must be a positive integer (minor units)"
    ),
})

export const priceListOverrideUpdateSchema = priceListOverrideCreateSchema.partial()

export const priceResolvedProductSchema = z.object({
  productId: z.string(),
  basePriceMinor: z.string(),
  priceMinor: z.string(),
  priceListId: z.string().nullable(),
  source: z.enum(["base", "price_list"]),
})

export type PriceResolvedProduct = z.infer<typeof priceResolvedProductSchema>

export const listPriceLists = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/price-lists",
  })
  .input(z.object({ organizationId: z.string() }))
  .output(z.array(priceListSchema))

export const getPriceList = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/price-lists/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(priceListDetailSchema)

export const createPriceList = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/price-lists",
  })
  .input(
    priceListCreateSchema.extend({
      organizationId: z.string(),
    })
  )
  .output(priceListSchema)

export const updatePriceList = oc
  .route({
    method: "PATCH",
    path: "/organizations/{organizationId}/price-lists/{id}",
  })
  .input(
    priceListUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(priceListSchema)

export const deletePriceList = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/price-lists/{id}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))

export const addPriceListOverride = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/price-lists/{id}/overrides",
  })
  .input(
    priceListOverrideCreateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
    })
  )
  .output(priceListOverrideSchema)

export const updatePriceListOverride = oc
  .route({
    method: "PUT",
    path: "/organizations/{organizationId}/price-lists/{id}/overrides/{productId}",
  })
  .input(
    priceListOverrideUpdateSchema.extend({
      organizationId: z.string(),
      id: z.string(),
      productId: z.string(),
    })
  )
  .output(priceListOverrideSchema)

export const removePriceListOverride = oc
  .route({
    method: "DELETE",
    path: "/organizations/{organizationId}/price-lists/{id}/overrides/{productId}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      id: z.string(),
      productId: z.string(),
    })
  )
  .output(z.object({ success: z.boolean() }))

export const resolveProductPrice = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/price-lists/resolve/{productId}",
  })
  .input(
    z.object({
      organizationId: z.string(),
      productId: z.string(),
      customerId: z.string().optional(),
      priceListId: z.string().optional(),
    })
  )
  .output(priceResolvedProductSchema)

export const resolveProductPrices = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/price-lists/resolve",
  })
  .input(
    z.object({
      organizationId: z.string(),
      customerId: z.string().optional(),
      priceListId: z.string().optional(),
      productIds: z.array(z.string()).min(1),
    })
  )
  .output(z.array(priceResolvedProductSchema))
