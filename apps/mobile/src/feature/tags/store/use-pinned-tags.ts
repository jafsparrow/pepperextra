import { useSyncExternalStore } from "react"

/**
 * Personal pinned-tag preference (user_metadata.pinnedTagIds). Module-level
 * state for now; wire to PATCH /users/me/pinned-tags once the API module
 * exists (MODULE 08).
 */

const MAX_PINNED_TAGS = 10

let pinnedTagIds: string[] = ["tag-wires", "tag-pipes", "tag-cement", "tag-paint"]

const listeners = new Set<() => void>()

function setPinnedTagIds(next: string[]) {
  pinnedTagIds = next
  listeners.forEach((l) => l())
}

export function togglePinnedTag(id: string) {
  const isPinned = pinnedTagIds.includes(id)
  if (isPinned) {
    setPinnedTagIds(pinnedTagIds.filter((t) => t !== id))
  } else if (pinnedTagIds.length < MAX_PINNED_TAGS) {
    setPinnedTagIds([...pinnedTagIds, id])
  }
}

export function usePinnedTagIds(): string[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => pinnedTagIds,
  )
}
