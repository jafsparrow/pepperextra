import { createDatabaseClient } from "@pepperextra/db/client"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import * as authschema from "@pepperextra/db/auth-schema"
import {
  account,
  session,
  user,
  verification,
} from "@pepperextra/db/auth-schema"
import { type NodePgDatabase } from "drizzle-orm/node-postgres"
import {
  admin as adminPlugin,
  createAccessControl,
  organization,
} from "better-auth/plugins"

import type { OrganizationOptions } from "better-auth/plugins"
import {
  ac,
  customAdminRole,
  financeRole,
} from "./admin-access-control/roles.js"
import {
  orgAccessControl,
  staff,
  cashier,
  manager,
  systemRoles,
} from "./org-access-control/org-roles.js"

// NOTE- This is used by external apps who provides the db client
// and want to create an instance of BetterAuth with the provided db client..
//  This is useful for apps that want to use BetterAuth with
// their own database client,
// instead of using the default one provided by BetterAuth. Usually because
// of .env variables provided by the external app.
interface AuthConfigOptions {
  secret: string
  baseUrl: string
  organizationHooks?: NonNullable<OrganizationOptions["organizationHooks"]>
}

export const createAuthInstance = (
  dbClient: any,
  options: AuthConfigOptions
) => {
  return betterAuth({
    database: drizzleAdapter(dbClient, {
      provider: "pg",
      schema: authschema,
    }),
    secret: options.secret,
    baseURL: options.baseUrl,
    user: {
      additionalFields: {
        customAccountType: {
          type: ["owner", "staff"],
          required: false,
          defaultValue: "staff",
        },
      },
    },
    plugins: [
      organization({
        ac: orgAccessControl,
        roles: {
          staff,
          cashier,
          manager,
          ...systemRoles,
        },
        teams: { enabled: true },
        allowUserToCreateOrganization: async (user) => {
          // [note]: this could be used to restrict the org creation.
          // const subscription = await getSubscription(user.id)
          return true // subscription.plan === "pro"
        },
        organizationHooks: options.organizationHooks ?? {},
      }),
      adminPlugin({
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
  })
}

export type AuthInstance = ReturnType<typeof createAuthInstance>

// export const config = {
//   database: drizzleAdapter(
//     createDatabaseClient(process.env.PEPPER_DATABASE_URL!),
//     { provider: "pg" }
//   ),

//   baseURL: "http://localhost:3000",
//   emailAndPassword: {
//     enabled: true,
//   },
// } satisfies BetterAuthOptions

// export const auth = betterAuth(config)
// export const Session = typeof auth.$Infer.Session

// [note]: after adding the organisation and admin pugic, typescript has issue because of in
// the betterAuth instance generates massively nested, inferred internal types. TypeScript tries to generate a .d.ts type declaration
//  file for your package, but because those internal types (in this case, from zod) aren't directly exported
//  at the top level of the package boundary, TypeScript panics and complains that the type is "not portable."
// [FIX]: Turn off declaration emitting (Best if this package isn't a shared library), maily because we are not build  *.d.ts file to be exported.
// in tsconfig: {
//   "compilerOptions": {
//     "declaration": false,
//     "declarationMap": false
//   }
// }
