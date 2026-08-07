import { oc } from "@orpc/contract"
import z from "zod"

export const catalogVersionSchema = z.object({
  organizationId: z.string(),
  version: z.number().int(),
  lastChangedAt: z.string().datetime().nullable().optional(),
})

export type CatalogVersion = z.infer<typeof catalogVersionSchema>

export const syncProductGroupRowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  specName: z.string(),
  stockTrackingMode: z.enum(["group", "sku"]),
  groupReorderThreshold: z.number().int().nullable().optional(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductGroupRow = z.infer<typeof syncProductGroupRowSchema>

export const syncProductRowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productGroupId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  name: z.string(),
  skuCode: z.string().nullable().optional(),
  specCode: z.string().nullable().optional(),
  brandTag: z.string().nullable().optional(),
  basePriceMinor: z.string(),
  activeCostPriceMinor: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  aliases: z.array(z.string()).nullable().optional(),
  eligibleForLoyalty: z.boolean().default(false),
  reorderThreshold: z.number().int().nullable().optional(),
  needsNotes: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductRow = z.infer<typeof syncProductRowSchema>

export const syncCategoryRowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  parentId: z.string().nullable().optional(),
  name: z.string(),
  sortOrder: z.number().int().default(0),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncCategoryRow = z.infer<typeof syncCategoryRowSchema>

export const syncProductImageRowSchema = z.object({
  id: z.string(),
  productId: z.string(),
  organizationId: z.string(),
  imageUrl: z.string(),
  isPrimary: z.boolean().default(false),
  altText: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductImageRow = z.infer<typeof syncProductImageRowSchema>

export const syncProductAlternativeRowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  productId: z.string(),
  alternativeProductId: z.string(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductAlternativeRow = z.infer<
  typeof syncProductAlternativeRowSchema
>

export const syncPriceListRowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncPriceListRow = z.infer<typeof syncPriceListRowSchema>

export const syncPriceListOverrideRowSchema = z.object({
  id: z.string(),
  priceListId: z.string(),
  productId: z.string(),
  organizationId: z.string(),
  priceMinor: z.string(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncPriceListOverrideRow = z.infer<
  typeof syncPriceListOverrideRowSchema
>

export const syncProductLocationOverrideRowSchema = z.object({
  id: z.string(),
  productId: z.string(),
  teamId: z.string(),
  organizationId: z.string(),
  priceOverrideMinor: z.string().nullable().optional(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductLocationOverrideRow = z.infer<
  typeof syncProductLocationOverrideRowSchema
>

export const syncProductTagRowSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  teamId: z.string(),
  name: z.string(),
  colour: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductTagRow = z.infer<typeof syncProductTagRowSchema>

export const syncProductTagAssignmentRowSchema = z.object({
  tagId: z.string(),
  productId: z.string(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type SyncProductTagAssignmentRow = z.infer<
  typeof syncProductTagAssignmentRowSchema
>

export const syncStockRowSchema = z.object({
  productId: z.string(),
  teamId: z.string(),
  organizationId: z.string(),
  quantity: z.string(),
  updatedAt: z.string().datetime(),
})

export type SyncStockRow = z.infer<typeof syncStockRowSchema>

export const catalogDeltaSchema = z.object({
  products: z.array(syncProductRowSchema),
  productGroups: z.array(syncProductGroupRowSchema),
  categories: z.array(syncCategoryRowSchema),
  productImages: z.array(syncProductImageRowSchema),
  productAlternatives: z.array(syncProductAlternativeRowSchema),
  priceLists: z.array(syncPriceListRowSchema),
  priceListOverrides: z.array(syncPriceListOverrideRowSchema),
  productLocationOverrides: z.array(syncProductLocationOverrideRowSchema),
  productTags: z.array(syncProductTagRowSchema),
  productTagAssignments: z.array(syncProductTagAssignmentRowSchema),
})

export type CatalogDelta = z.infer<typeof catalogDeltaSchema>

export const catalogStockPayloadSchema = z.object({
  organizationId: z.string(),
  teamId: z.string(),
  stock: z.array(syncStockRowSchema),
})

export type CatalogStockPayload = z.infer<typeof catalogStockPayloadSchema>

export const revalidateStockResultSchema = z.object({
  productId: z.string(),
  quantity: z.string(),
})

export type RevalidateStockResult = z.infer<typeof revalidateStockResultSchema>

export const getCatalogVersion = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/catalog/version",
  })
  .input(z.object({ organizationId: z.string() }))
  .output(catalogVersionSchema)

export const syncCatalog = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/catalog/sync",
  })
  .input(
    z.object({
      organizationId: z.string(),
      since: z.string().datetime().optional(),
      teamId: z.string().optional(),
    })
  )
  .output(catalogDeltaSchema)

export const getCatalogStock = oc
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/catalog/stock",
  })
  .input(
    z.object({
      organizationId: z.string(),
      teamId: z.string(),
    })
  )
  .output(catalogStockPayloadSchema)

export const revalidateCatalogStock = oc
  .route({
    method: "POST",
    path: "/organizations/{organizationId}/catalog/revalidate",
  })
  .input(
    z.object({
      organizationId: z.string(),
      teamId: z.string(),
      skuIds: z.array(z.string()).min(1),
    })
  )
  .output(z.array(revalidateStockResultSchema))
