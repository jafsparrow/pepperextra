import { betterAuth, type BetterAuthOptions } from "better-auth"
import { db } from "@pepperextra/db/drizzle-cli"
import { createAuthConfig } from "./auth-config"
// NOTE: This file is used by the BetterAuth CLI to generate the auth schema. It should not be used in production code.
export const auth = betterAuth(
  createAuthConfig(db, {
    baseUrl: "http://localhost:3000",
    secret: process.env.PEPPER_AUTH_SECRET!,
  })
)
