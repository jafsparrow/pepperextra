import { createDatabaseClient } from "@pepperextra/db/client"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { type NodePgDatabase } from "drizzle-orm/node-postgres"

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
    }),
    secret: options.secret,
    baseURL: options.baseUrl,
    emailAndPassword: {
      enabled: true,
    },
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
