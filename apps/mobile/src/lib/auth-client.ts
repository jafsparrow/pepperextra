import { createAuthClient } from "better-auth/react"
import { expoClient } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"

import { createAuthClientPlugins } from "@repo/auth/client"

/**
 * Native auth client for the mobile app.
 *
 * Unlike the web app (which uses the shared `authClient` singleton from
 * `@repo/auth/client` and cookie-based cross-origin auth), native builds need:
 * - a device-reachable baseURL (set via EXPO_PUBLIC_API_URL)
 * - SecureStore-backed session storage via the `expoClient` plugin
 * - the same shared plugin config (additional fields, admin, organization)
 *
 * The shared `createAuthClientPlugins` comes from `@repo/auth/client`.
 */
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

console.log("Using baseURL for authClient:", baseURL)
export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "mobile",
      storagePrefix: "mobile",
      storage: SecureStore,
    }),
    ...createAuthClientPlugins(),
  ],
})

export const { signIn, signOut } = authClient
