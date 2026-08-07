import { useSyncExternalStore } from 'react'

import type { CartLine, PosProduct } from '@/feature/pos/types'

/**
 * Module-level cart store shared between the POS screen and the cart screen
 * (mobile view). The cart must survive route navigation, so state lives outside
 * React. Replace with a proper server-backed quote session when the quotation
 * engine (BRD §8.1) is wired up.
 */
let lines: CartLine[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getCartLines(): CartLine[] {
  return lines
}

export function addToCart(product: PosProduct, quantity = 1) {
  const existing = lines.find((l) => l.product.id === product.id)
  lines = existing
    ? lines.map((l) =>
        l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l,
      )
    : [...lines, { product, quantity }]
  emit()
}

export function changeCartLineQty(id: string, delta: number) {
  lines = lines
    .map((l) => (l.product.id === id ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
    .filter((l) => l.quantity > 0)
  emit()
}

export function clearCart() {
  lines = []
  emit()
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getCartLines, getCartLines)
  const count = snapshot.reduce((sum, l) => sum + l.quantity, 0)
  const subtotal = snapshot.reduce((sum, l) => sum + l.product.salePriceMinor * l.quantity, 0)
  return { lines: snapshot, count, subtotal }
}
