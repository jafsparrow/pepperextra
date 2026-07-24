Feature scaffold prompt

Use this prompt when you want an agent to create a new feature folder structure:

"Create a new frontend feature under `apps/web/src/feature/<feature-name>/` using the repo's feature scaffolding conventions. Include `constants/`, `schema/`, `store/`, and `ui/components/` as needed, and add a descriptive `.md` file inside each folder to explain its purpose. If the feature has page sections, add `sections/sections.md`. If the feature needs backend wrapper logic, add `server.ts`."

If the feature is only UI, omit `server.ts` and `sections/` unless they are needed.

Example response structure:

- `apps/web/src/feature/<feature-name>/constants/constants.md`
- `apps/web/src/feature/<feature-name>/schema/<feature>-schema.md`
- `apps/web/src/feature/<feature-name>/store/store.md`
- `apps/web/src/feature/<feature-name>/ui/components/<component-name>.tsx`
- `apps/web/src/feature/<feature-name>/sections/sections.md` (optional)
- `apps/web/src/feature/<feature-name>/server.ts` (optional)
