import { createDatabaseClient } from "@pepperextra/db/client"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import * as schema from "@pepperextra/db/schema"
import { BetterAuthOptions } from "better-auth/minimal"
import { admin, organization } from "better-auth/plugins"
import {
  cashier,
  manager,
  orgAccessControl,
  staff,
} from "./org-access-control/org-roles"
import { ac, customAdminRole, financeRole } from "./admin-access-control/roles"

type SchemaType = typeof schema
interface AuthConfigOptions {
  secret: string
  baseUrl: string
}

export const createAuthConfig = (
  dbClient: any,
  options: AuthConfigOptions
): BetterAuthOptions => {
  return {
    database: drizzleAdapter(dbClient, {
      provider: "pg",
      schema: schema,
    }),
    secret: options.secret,
    baseURL: options.baseUrl,
    plugins: [
      organization({
        ac: orgAccessControl,
        roles: {
          staff,
          cashier,
          manager,
        },
        teams: { enabled: true },
        allowUserToCreateOrganization: async (user) => {
          // [note]: this could be used to restrict the org creation.
          // const subscription = await getSubscription(user.id)
          return true // subscription.plan === "pro"
        },
        organizationHooks: {},
      }),
      admin({
        ac: ac,
        roles: {
          customAdminRole,
          financeRole,
        },
      }),
    ],
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["http://localhost:3001", "http://localhost:5173"],
  }
}
