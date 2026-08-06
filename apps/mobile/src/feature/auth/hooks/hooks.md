# Auth hooks

React hooks wrapping the mobile `authClient` for the auth screens.

- `use-login.ts` — `signIn.email` + normalized error string
- `use-set-password.ts` — forced password reset: `changePassword` then
  `updateUser({ passwordResetRequired: false })`
- `use-change-password.ts` — settings screen change password via
  `orpc.user.changeOwnPassword` (same contract flow as the web reset-password
  page), backed by a TanStack Query `useMutation`
- `use-sign-out.ts` — `signOut` + `resetRouter` to `/login`

Each hook follows the web pattern: surface `error.message` from the better-auth
result and expose `isPending`.
