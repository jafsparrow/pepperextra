import { createDatabaseClient } from "@pepperextra/db/client"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import * as schema from "@pepperextra/db/schema"
import { type NodePgDatabase } from "drizzle-orm/node-postgres"
// NOTE- This is used by external apps who provides the db client
// and want to create an instance of BetterAuth with the provided db client..
//  This is useful for apps that want to use BetterAuth with
// their own database client,
// instead of using the default one provided by BetterAuth. Usually because
// of .env variables provided by the external app.
interface AuthConfigOptions {
  secret: string
  baseUrl: string
}

export const createAuthInstance = (
  dbClient: any,
  options: AuthConfigOptions
) => {
  return betterAuth({
    database: drizzleAdapter(dbClient, {
      provider: "pg",
      schema: schema,
    }),
    secret: options.secret,
    baseURL: options.baseUrl,
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
