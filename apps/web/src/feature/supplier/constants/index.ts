export const SUPPLIER_QUERY_KEYS = {
  all: ["suppliers"] as const,
  lists: () => [...SUPPLIER_QUERY_KEYS.all, "list"] as const,
  list: (orgId: string | undefined, teamId?: string) =>
    [...SUPPLIER_QUERY_KEYS.lists(), orgId, teamId] as const,
  details: () => [...SUPPLIER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SUPPLIER_QUERY_KEYS.details(), id] as const,
  invoices: () => [...SUPPLIER_QUERY_KEYS.all, "invoices"] as const,
  invoiceList: (orgId: string, supplierId: string) =>
    [...SUPPLIER_QUERY_KEYS.invoices(), orgId, supplierId] as const,
  invoiceDetail: (orgId: string, supplierId: string, invoiceId: string) =>
    [...SUPPLIER_QUERY_KEYS.invoices(), orgId, supplierId, invoiceId] as const,
  payments: () => [...SUPPLIER_QUERY_KEYS.all, "payments"] as const,
  paymentList: (orgId: string, supplierId: string) =>
    [...SUPPLIER_QUERY_KEYS.payments(), orgId, supplierId] as const,
}
