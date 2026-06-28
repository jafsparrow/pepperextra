import { db } from "@pepperextra/db/client"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
export const config = {
  database: drizzleAdapter(db, { provider: "pg" }),

  baseURL: "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
} satisfies BetterAuthOptions

export const auth = betterAuth(config)
// export const Session = typeof auth.$Infer.Session
