Prompts and how to use this skill

When an agent needs to act in this repository, prefer the following sequence:

1. Read `SKILL.md` and the module most relevant to the task (apps.md, packages.md, configs.md).
2. Confirm which app/package is affected and which scripts must run to validate a change.
3. If the change touches runtime behavior (API, DB, auth), ensure the agent documents required environment variables.
4. Run focused commands with `pnpm --filter <pkg_or_app> <script>` or `pnpm dev` at root for multi-app dev.

Useful prompts for the agent

- "How do I run the API locally?" → consult `apps.md` and show `pnpm --filter api dev`.
- "How do I run the web app locally?" → consult `apps.md` and show `pnpm --filter web dev`.
- "How do I run the mobile app locally?" → consult `apps.md` and show `pnpm --filter mobile dev`.
- "Where is auth implemented?" → consult `packages.md` to find `@buildmate/auth` and its exports.
- "Where is the database schema?" → consult `packages.md` to find `@buildmate/db` schema organization.
- "Which env variables are required to run the backend?" → consult `configs.md`.
- "What are the multi-tenancy rules?" → consult `configs.md` agent notes.
- "What are the immutable record rules?" → consult `configs.md` agent notes.
- "How does the quotation alternative pricing work?" → consult `01_BRD.md` section 8.1 and `04_CODING_AGENT_CONTEXT.md` section 4.1.

When generating code, include minimal runnable changes, update package `build` scripts if adding a build step, and add tests for visible behavior changes.

Key conventions for agents

- Every query must include `org_id` scoping — see `configs.md` and `04_CODING_AGENT_CONTEXT.md` section 2.1.
- Use `decimal.js` for all monetary calculations — see `configs.md` and `04_CODING_AGENT_CONTEXT.md` section 8.3.
- Drizzle queries must use object syntax (v1.0.0-rc.4) — see `04_CODING_AGENT_CONTEXT.md` section 8.2.
- Inject database via `DRIZZLE_TOKEN` — see `04_CODING_AGENT_CONTEXT.md` section 8.3.
- Use transactions for multi-table operations — see `04_CODING_AGENT_CONTEXT.md` section 8.4.
- API routes use kebab-case plural — see `04_CODING_AGENT_CONTEXT.md` section 11.
- Better Auth org = BuildMate tenant, team = location — see `AGENTS.md` naming differences table.