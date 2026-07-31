export const CUSTOMER_QUERY_KEYS = {
  all: ["customers"] as const,
  lists: () => [...CUSTOMER_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined, teamId?: string) =>
    [...CUSTOMER_QUERY_KEYS.lists(), orgId, teamId] as const,
  details: () => [...CUSTOMER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
}

export const CUSTOMER_TYPE_LABELS = {
  retail: "Retail",
  account: "Account",
  contractor: "Contractor",
} as const
