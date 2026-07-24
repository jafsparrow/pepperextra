Feature Folder Structure — repo feature scaffolding

This skill captures how new frontend features should be organized in `apps/web/src/feature/*` using the existing `org` feature as the source of truth.

The goal is to let agents and developers create new feature folders with the correct structure and place generated components, schema, store, and constants in the preferred locations.

Contents:

- `folders.md` — folder-by-folder conventions and usage guidance.
- `agent.instructions.md` — how agents should scaffold new features and place files.
- `prompt.md` — a reusable prompt for generating feature folder structures.

The org feature currently uses these feature folders:

- `constants/`
- `schema/`
- `store/`
- `ui/components/`
- `sections/` (optional feature sections)
- `server.ts`

Each folder should include an `.md` file that documents its purpose.
