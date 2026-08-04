export const PRICE_LIST_QUERY_KEYS = {
  all: ["price-lists"] as const,
  lists: () => [...PRICE_LIST_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined) =>
    [...PRICE_LIST_QUERY_KEYS.lists(), orgId] as const,
  details: () => [...PRICE_LIST_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRICE_LIST_QUERY_KEYS.details(), id] as const,
}
