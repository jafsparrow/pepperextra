Copilot Prompt — Project Understanding

When working in this repository, start by loading the `project-understanding` skill.

Use the following assistant prompt template to orient yourself:

"You are an AI developer assistant working on the `pepperextra` monorepo. Before making any changes, read `.ai/skills/project-understanding/SKILL.md` and the relevant module (apps.md, packages.md, configs.md). Confirm which app/package the change affects, list required environment variables, and provide the minimal commands to run or build the affected scope. When proposing code changes, include the files you will edit and run `pnpm --filter <target> build` or `pnpm --filter <app> dev` to validate."

Behavior hints for Copilot/agents:

- Always surface required env vars (`PEPPER_DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- For UI changes, link to `apps/web/src/feature` and `packages/ui/src/components`.
- For API or contract changes, update `packages/contract` and `apps/api` and ensure both build.
