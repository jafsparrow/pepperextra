import { MOCK_CUSTOMERS } from '@/feature/customer/constants/mock-customers'
import type { Customer } from '@/feature/customer/types'

export const RECENT_CUSTOMER_LIMIT = 15

/**
 * PLACEHOLDER — recently purchased customers (most recent purchase first).
 * Will be backed by a real query over `customers.last_purchase_at` once the
 * customer contract lands.
 */
export function getRecentCustomers(limit = RECENT_CUSTOMER_LIMIT): Customer[] {
  return [...MOCK_CUSTOMERS]
    .sort((a, b) => (b.lastPurchaseAt ?? '').localeCompare(a.lastPurchaseAt ?? ''))
    .slice(0, limit)
}

export function searchCustomers(query: string): Customer[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return MOCK_CUSTOMERS.filter(
    (c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q),
  )
}
