export const SUPPLIER_QUERY_KEYS = {
  all: ["suppliers"] as const,
  lists: () => [...SUPPLIER_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined, teamId?: string) =>
    [...SUPPLIER_QUERY_KEYS.lists(), orgId, teamId] as const,
  details: () => [...SUPPLIER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SUPPLIER_QUERY_KEYS.details(), id] as const,
}
