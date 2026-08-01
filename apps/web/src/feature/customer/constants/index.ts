export const CUSTOMER_QUERY_KEYS = {
  all: ["customers"] as const,
  lists: () => [...CUSTOMER_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined, teamId?: string) =>
    [...CUSTOMER_QUERY_KEYS.lists(), orgId, teamId] as const,
  details: () => [...CUSTOMER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CUSTOMER_QUERY_KEYS.details(), id] as const,
  invoices: (id: string) => [...CUSTOMER_QUERY_KEYS.detail(id), "invoices"] as const,
  payments: (id: string) => [...CUSTOMER_QUERY_KEYS.detail(id), "payments"] as const,
  creditNotes: (id: string) =>
    [...CUSTOMER_QUERY_KEYS.detail(id), "credit-notes"] as const,
  warrantyClaims: (id: string) =>
    [...CUSTOMER_QUERY_KEYS.detail(id), "warranty-claims"] as const,
  sites: (id: string) => [...CUSTOMER_QUERY_KEYS.detail(id), "sites"] as const,
}

export const CUSTOMER_TYPE_LABELS = {
  retail: "Retail",
  account: "Account",
  contractor: "Contractor",
} as const

export const SITE_STATUS_LABELS = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
} as const
