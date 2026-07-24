Agent Instructions — feature folder structure

When scaffolding a new frontend feature in this repository, use the `feature-structure` skill to place files in the right folders.

1. Create a top-level folder at `apps/web/src/feature/<feature-name>/`.
2. Add the appropriate subfolders from the org feature conventions:
   - `constants/`
   - `schema/`
   - `store/`
   - `ui/components/`
   - `sections/` (optional)
   - `server.ts` (optional)
3. For each folder created, add an `.md` file describing the folder purpose. Example:
   - `constants/constants.md`
   - `schema/<feature>-schema.md`
   - `store/store.md`
   - `sections/sections.md`
4. Place generated components in `ui/components/`.
5. Place local validation or data models in `schema/`.
6. Place feature-specific state management in `store/`.
7. Place shared constants and query keys in `constants/`.
8. Only create folders that are actually needed by the feature.

Use these conventions to guide the placement of new files and avoid ad-hoc folder placement.
