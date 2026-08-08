import { useSyncExternalStore } from 'react'

import {
  ALTERNATIVE_COLORS,
  MAX_ALTERNATIVES_PER_ITEM,
  type AlternativeColor,
} from '@/feature/pos/constants/alternatives'
import type { CartLine, CartResolveMode, PosProduct } from '@/feature/pos/types'
import { applyTax } from '@/lib/money'

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

export function addToCart(product: PosProduct, quantity = 1, unitPriceMinor?: number) {
  const existing = lines.find((l) => l.product.id === product.id)
  if (existing) {
    lines = lines.map((l) =>
      l.product.id === product.id
        ? {
            ...l,
            quantity: l.quantity + quantity,
            unitPriceMinor: unitPriceMinor ?? l.unitPriceMinor,
          }
        : l,
    )
  } else {
    lines = [
      ...lines,
      { product, quantity, unitPriceMinor: unitPriceMinor ?? product.salePriceMinor, alternatives: [] },
    ]
  }
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

/** Default alternative for a line: the is_primary row, else the first one. */
function resolveDefaultAlternative(line: CartLine): PosProduct | undefined {
  const alternatives = line.product.alternatives ?? []
  const defaultId = line.product.defaultAlternativeId
  return alternatives.find((a) => a.id === defaultId) ?? alternatives[0]
}

function nextFreeColor(line: CartLine): AlternativeColor | undefined {
  const used = new Set(line.alternatives.map((a) => a.color))
  return ALTERNATIVE_COLORS.find((color) => !used.has(color))
}

/** "Alter" — add the default alternative as the first (yellow) slot on every line that can take one. */
export function alterCart() {
  lines = lines.map((line) => {
    if (line.alternatives.length >= MAX_ALTERNATIVES_PER_ITEM) return line
    const color = nextFreeColor(line)
    const candidate = resolveDefaultAlternative(line)
    if (!color || !candidate || line.alternatives.some((a) => a.product.id === candidate.id)) return line
    return {
      ...line,
      alternatives: [
        ...line.alternatives,
        { color, product: candidate, unitPriceMinor: candidate.salePriceMinor },
      ],
    }
  })
  emit()
}

/** Add a specific alternative to a line, filling the next free colour slot. */
export function addAlternative(lineId: string, productId: string) {
  lines = lines.map((line) => {
    if (line.product.id !== lineId) return line
    const color = nextFreeColor(line)
    const candidate = (line.product.alternatives ?? []).find((a) => a.id === productId)
    if (!color || !candidate || line.alternatives.some((a) => a.product.id === candidate.id)) return line
    return {
      ...line,
      alternatives: [
        ...line.alternatives,
        { color, product: candidate, unitPriceMinor: candidate.salePriceMinor },
      ],
    }
  })
  emit()
}

/** Radio selection: alternativeId = null selects the base (white) row. */
export function setLineSelection(lineId: string, alternativeId: string | null) {
  lines = lines.map((line) => {
    if (line.product.id !== lineId) return line
    if (alternativeId != null && !line.alternatives.some((a) => a.product.id === alternativeId)) return line
    return { ...line, selectedAlternativeId: alternativeId ?? undefined }
  })
  emit()
}

/** Free a colour slot by removing that alternative row. */
export function removeAlternative(lineId: string, color: AlternativeColor) {
  lines = lines.map((line) => {
    if (line.product.id !== lineId) return line
    const removed = line.alternatives.find((a) => a.color === color)
    const selectedGone = removed != null && line.selectedAlternativeId === removed.product.id
    return {
      ...line,
      alternatives: line.alternatives.filter((a) => a.color !== color),
      selectedAlternativeId: selectedGone ? undefined : line.selectedAlternativeId,
    }
  })
  emit()
}

/** Resolve cart lines for a confirm mode: the radio-mixed selection or a single colour. */
export function resolveCartLines(snapshot: CartLine[], mode: CartResolveMode): CartLine[] {
  return snapshot.map((line) => {
    const alt =
      mode === 'selected'
        ? line.alternatives.find((a) => a.product.id === line.selectedAlternativeId)
        : line.alternatives.find((a) => a.color === mode)
    if (!alt) return line
    return { ...line, product: alt.product, unitPriceMinor: alt.unitPriceMinor }
  })
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getCartLines, getCartLines)
  const count = snapshot.reduce((sum, l) => sum + l.quantity, 0)

  const selectedTotal = snapshot.reduce((sum, l) => {
    const alt = l.alternatives.find((a) => a.product.id === l.selectedAlternativeId)
    return sum + (alt ? alt.unitPriceMinor : l.unitPriceMinor) * l.quantity
  }, 0)

  const colorTotals = {} as Record<AlternativeColor, number>
  for (const color of ALTERNATIVE_COLORS) {
    colorTotals[color] = snapshot.reduce((sum, l) => {
      const alt = l.alternatives.find((a) => a.color === color)
      return sum + (alt ? alt.unitPriceMinor : l.unitPriceMinor) * l.quantity
    }, 0)
  }

  const tax = applyTax(selectedTotal)
  const hasAlternatives = snapshot.some((l) => l.alternatives.length > 0)

  return {
    lines: snapshot,
    count,
    subtotal: selectedTotal,
    colorTotals,
    tax,
    total: selectedTotal + tax,
    hasAlternatives,
  }
}
