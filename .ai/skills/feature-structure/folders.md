Feature Folder Conventions

Use the `apps/web/src/feature/<feature-name>/` folder for a new frontend feature.
Each feature folder should contain subfolders and files that mirror the `org` feature conventions.

Recommended structure:

- `server.ts`
  - Optional feature server-side or API wrapper logic used by the feature.
  - Place route-specific or backend-facing orchestration here if the feature needs it.
  - Include a `server.ts` file only when the feature has logic beyond UI components.

- `constants/`
  - Store feature-specific constants and TanStack Query key definitions.
  - Examples: query keys, feature-specific labels, table column keys.
  - Add `constants.md` to explain what is stored here.

- `schema/`
  - Store frontend-specific Zod schemas that are not shared through `packages/contract`.
  - Use this for UI validation schemas, form schemas, or local model definitions.
  - Add `org-schema.md` or `<feature>-schema.md` to document the schema folder.

- `store/`
  - Store local feature state management definitions.
  - Use Zustand or any client-side state store for feature-specific state.
  - Add `store.md` to describe how store state is organized.

- `ui/components/`
  - Store feature-specific UI components.
  - Place forms, modals, lists, and reusable UI pieces here.
  - Use descriptive filenames like `org-add-form.tsx`, `team-add-modal.tsx`, etc.

- `sections/`
  - Optional folder for feature page sections or layout sections.
  - Useful when the feature splits into multiple screen sections.
  - Document the folder with `sections.md` when used.

General rules:

- `.md` files represent the folder meaning and should accompany the folder when it is created.
- Keep feature boundaries narrow: UI components under `ui/components`, state in `store`, and constants in `constants`.
- If your feature does not need a folder, do not create an empty folder.
- Prefer single-purpose component files and descriptive file names.
