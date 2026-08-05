import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { ac, customAdminRole, financeRole } from "./admin-access-control/roles"
import {
  orgAccessControl,
  owner,
  manager,
  branchManager,
  salesperson,
  cashier,
  stationStaff,
  staff,
  systemRoles,
} from "./org-access-control/org-roles"

/**
 * Shared client plugin config, reused by every auth client (web + mobile).
 * Each consumer composes it into its own `createAuthClient` call with the
 * transport/config that fits its platform (cookie auth on web, SecureStore
 * storage via `expoClient` on native).
 */
export const createAuthClientPlugins = () => [
  inferAdditionalFields({
    user: {
      customAccountType: {
        type: ["owner", "staff"],
        required: false,
        defaultValue: "staff",
        input: true,
      },
      passwordResetRequired: {
        type: "boolean",
        required: false,
        defaultValue: true,
        // input: true so the mobile client can clear the flag via updateUser
        // after a forced password reset (changePassword does not fire
        // onPasswordReset in better-auth 1.6.22).
        input: true,
      },
    },
  }),
  adminClient({
    ac: ac,
    roles: {
      customAdminRole,
      financeRole,
    },
  }),
  organizationClient({
    teams: { enabled: true },
    ac: orgAccessControl,
    roles: {
      ...systemRoles,
      owner,
      manager,
      branchManager,
      salesperson,
      cashier,
      stationStaff,
      staff,
    },
  }),
]

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
  plugins: createAuthClientPlugins(),
  advanced: {
    crossOriginCookies: true,
  },
})

// Explicit export of some functions for convenience
export const { signIn, signOut, signUp } = authClient
