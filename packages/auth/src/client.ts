import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
  plugins: [adminClient()],
  advanced: {
    crossOriginCookies: true,
  },
})

// Explicit export of some functions for convenience
export const { signIn, signOut, signUp } = authClient
