export const PRODUCT_GROUP_QUERY_KEYS = {
  all: ["product-groups"] as const,
  lists: () => [...PRODUCT_GROUP_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined) =>
    [...PRODUCT_GROUP_QUERY_KEYS.lists(), orgId] as const,
  details: () => [...PRODUCT_GROUP_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_GROUP_QUERY_KEYS.details(), id] as const,
}

export const STOCK_TRACKING_LABELS = {
  group: "Group",
  sku: "Per SKU",
} as const
