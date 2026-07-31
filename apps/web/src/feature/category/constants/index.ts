export const CATEGORY_QUERY_KEYS = {
  all: ["categories"] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined) =>
    [...CATEGORY_QUERY_KEYS.lists(), orgId] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
}

export const STOCK_TRACKING_LABELS = {
  group: "Group",
  sku: "Per SKU",
} as const
