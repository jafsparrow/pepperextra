# Quick Spec Capsule Panel (POS)

A device-local, toggleable panel under the POS search bar that lets staff tap predefined "capsules" to build spec-code search queries without typing.

## Architecture

| Component | Path |
|-----------|------|
| Store (AsyncStorage) | `src/feature/pos/store/spec-code-store.ts` |
| Panel (chips) | `src/feature/pos/ui/components/spec-code-panel.tsx` |
| Edit modal (full-screen, 3 tabs) | `src/feature/pos/ui/components/spec-code-edit-modal.tsx` |
| Integration | `src/feature/pos/ui/screens/pos-screen.tsx` |

## Data Model

```ts
interface SpecCodeLists {
  types: string[]   // e.g. ["PP", "EL", "TE"]
  sizes: string[]   // e.g. ["20", "25", "32", "110"]
  brands: string[]  // e.g. ["-HILC", "STCT"]  (symbols included)
}
```

- Every entry is the **literal text appended** to the search query.
- Leading/trailing symbols are part of the token (e.g. `-HILC` appends `-HILC`).
- Staff compose exact specCodes by sequential taps: `PP` → `110UP` → `-HILC` → `PP110UP-HILC`.

## Persistence

- **Capsules**: `pos.spec-code-capsules.v1` (AsyncStorage)
- **Visibility toggle**: `pos.view-options.v1` (`{ showSpecCapsules: boolean }`)
- Hydrated once at app start; changes persisted immediately.

## User Flow

1. **Default on** — panel shows under search bar with three chip columns (no headers).
2. **Tap chip** → appends token to search query; results filter instantly.
3. **More menu (⋮) → "Hide Quick Spec"** — hides panel, preference saved.
4. **More menu → "Edit Quick Spec"** — opens full-screen modal with Types/Sizes/Brands tabs:
   - Existing codes as deletable chips
   - Input + Add button (type literal token, symbols allowed)

## Search Behaviour

- Search now matches `name` OR `sku` OR `specCode` OR `brandTag` (case-insensitive substring).
- Chip tokens concatenate literally; `PP` + `110` + `-HILC` produces query `PP110-HILC` which matches `PP110UP-HILC` (substring).
- Space-separated multi-token queries also work (AND match each token).

## Defaults (seeded on first launch)

```ts
types: ['PP', 'EL', 'TE']
sizes: ['20', '25', '32', '50', '110']
brands: ['-HILC', 'STCT']
```

## Adding to SearchField

The search field now includes a clear button (`✕`) that appears when query is non-empty:

```tsx
<SearchField
  value={query}
  onChangeText={setQuery}
  onClear={() => setQuery("")}
/>
```

## Spacing

- `searchWrap.paddingBottom = Spacing.one` (4dp) — tight gap below appbar
- `specWrap.paddingBottom = Spacing.one` (4dp) — tight gap between search and capsule panel