Prompts and how to use this skill

When an agent needs to act in this repository, prefer the following sequence:

1. Read `SKILL.md` and the module most relevant to the task (apps.md, packages.md, configs.md).
2. Confirm which app/package is affected and which scripts must run to validate a change.
3. If the change touches runtime behavior (API, DB, auth), ensure the agent documents required environment variables.
4. Run focused commands with `pnpm --filter <pkg_or_app> <script>` or `pnpm dev` at root for multi-app dev.

Useful prompts for the agent

- "How do I run the api locally?" → consult `apps.md` and show `pnpm --filter api dev`.
- "Where is auth implemented?" → consult `packages.md` to find `@pepperextra/auth` and its exports.
- "Which env variables are required to run the backend?" → consult `configs.md`.

When generating code, include minimal runnable changes, update package `build` scripts if adding a build step, and add tests for visible behavior changes.
