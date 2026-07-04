import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
  advanced: {
    crossOriginCookies: true,
  },
})

export const { signIn, signOut, signUp } = authClient
