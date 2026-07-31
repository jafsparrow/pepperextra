export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined, teamId?: string) =>
    [...PRODUCT_QUERY_KEYS.lists(), orgId, teamId] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
}

export const STOCK_TRACKING_LABELS = {
  group: "Group",
  sku: "Per SKU",
} as const

export const PRODUCT_COLUMNS = [
  "Product",
  "SKU",
  "Category",
  "Brand",
  "Base Price",
  "Unit",
  "Stock Mode",
] as const
