import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

export type SpecCodeListKey = 'types' | 'sizes' | 'brands'

/**
 * Device-local quick-spec capsules (BRD §8.1 — POS search helper).
 * Not stored in the DB: each staff device keeps its own list so a shop can
 * configure codes that match how its own specCodes are written.
 *
 * Every entry is the *literal* text appended to the search query when its
 * capsule is tapped. Leading/trailing symbols are part of the token, so a
 * brand like "-HILC" appends "-HILC", a size like "110UP" appends "110UP",
 * and the sequence PP + 110UP + -HILC composes "PP110UP-HILC".
 */
export interface SpecCodeLists {
  types: string[]
  sizes: string[]
  brands: string[]
}

const STORAGE_KEY = 'pos.spec-code-capsules.v1'
const VIEW_OPTIONS_KEY = 'pos.view-options.v1'

const DEFAULT_LISTS: SpecCodeLists = {
  types: ['PP', 'EL', 'TE'],
  sizes: ['20', '25', '32', '50', '110'],
  brands: ['-HILC', 'STCT'],
}

let lists: SpecCodeLists = DEFAULT_LISTS
let showSpecCapsules = true
let hydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function persist() {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
}

function persistViewOptions() {
  void AsyncStorage.setItem(VIEW_OPTIONS_KEY, JSON.stringify({ showSpecCapsules }))
}

export function getSpecCodeLists(): SpecCodeLists {
  return lists
}

export function getSpecCodeList(key: SpecCodeListKey): string[] {
  return lists[key]
}

export function addSpecCode(key: SpecCodeListKey, token: string) {
  const value = token.trim()
  if (!value || lists[key].includes(value)) return
  lists = { ...lists, [key]: [...lists[key], value] }
  persist()
  emit()
}

export function removeSpecCode(key: SpecCodeListKey, token: string) {
  if (!lists[key].includes(token)) return
  lists = { ...lists, [key]: lists[key].filter((t) => t !== token) }
  persist()
  emit()
}

export function getShowSpecCapsules(): boolean {
  return showSpecCapsules
}

export function setShowSpecCapsules(next: boolean) {
  showSpecCapsules = next
  persistViewOptions()
  emit()
}

/**
 * Hydrate once from AsyncStorage. Safe to call from multiple places — guarded
 * by the `hydrated` flag.
 */
export function hydrateSpecCodeLists() {
  if (hydrated) return
  hydrated = true
  void Promise.all([
    AsyncStorage.getItem(STORAGE_KEY),
    AsyncStorage.getItem(VIEW_OPTIONS_KEY),
  ]).then(([rawLists, rawView]) => {
    if (rawLists) {
      try {
        const parsed = JSON.parse(rawLists) as Partial<SpecCodeLists>
        lists = {
          types: Array.isArray(parsed.types) ? parsed.types : DEFAULT_LISTS.types,
          sizes: Array.isArray(parsed.sizes) ? parsed.sizes : DEFAULT_LISTS.sizes,
          brands: Array.isArray(parsed.brands) ? parsed.brands : DEFAULT_LISTS.brands,
        }
      } catch {
        // Corrupt payload — fall back to defaults.
      }
    }
    if (rawView) {
      try {
        const parsed = JSON.parse(rawView) as { showSpecCapsules?: boolean }
        if (typeof parsed.showSpecCapsules === 'boolean') {
          showSpecCapsules = parsed.showSpecCapsules
        }
      } catch {
        // Ignore
      }
    }
    emit()
  })
}

hydrateSpecCodeLists()

export function useSpecCodeLists() {
  return useSyncExternalStore(subscribe, getSpecCodeLists, getSpecCodeLists)
}

export function useShowSpecCapsules() {
  return useSyncExternalStore(subscribe, getShowSpecCapsules, getShowSpecCapsules)
}
