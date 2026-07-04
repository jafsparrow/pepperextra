import { betterAuth, type BetterAuthOptions } from "better-auth"
import { db } from "@pepperextra/db/drizzle-cli"
import { createAuthConfig } from "./auth-config"

export const auth = betterAuth(
  createAuthConfig(db, {
    baseUrl: "http://localhost:3000",
    secret: process.env.PEPPER_AUTH_SECRET!,
  })
)
