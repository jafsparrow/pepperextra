import { createDatabaseClient } from "@pepperextra/db/client"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import * as schema from "@pepperextra/db/schema"
import { BetterAuthOptions } from "better-auth/minimal"

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
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["http://localhost:3001", "http://localhost:5173"],
  }
}
