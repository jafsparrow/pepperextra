import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { ac, customAdminRole, financeRole } from "./admin-access-control/roles"
import {
  orgAccessControl,
  staff,
  cashier,
  manager,
} from "./org-access-control/org-roles"
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
  plugins: [
    adminClient({
      ac: ac,
      roles: {
        customAdminRole,
        financeRole,
      },
    }),
    organizationClient({
      ac: orgAccessControl,
      roles: {
        staff,
        cashier,
        manager,
      },
    }),
  ],
  advanced: {
    crossOriginCookies: true,
  },
})

// Explicit export of some functions for convenience
export const { signIn, signOut, signUp } = authClient
