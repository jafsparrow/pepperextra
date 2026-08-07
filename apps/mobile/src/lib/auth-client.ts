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

// Must stay in sync with the `storagePrefix` passed to `expoClient`: the expo
// plugin persists the session cookie and cached session data under these keys.
const STORAGE_PREFIX = "mobile"
const SESSION_COOKIE_KEY = `${STORAGE_PREFIX}_cookie`
const SESSION_CACHE_KEY = `${STORAGE_PREFIX}_session_data`

console.log("Using baseURL for authClient:", baseURL)
export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "mobile",
      storagePrefix: STORAGE_PREFIX,
      storage: SecureStore,
    }),
    ...createAuthClientPlugins(),
  ],
})

export const { signIn, signOut } = authClient

/**
 * Force-clear the locally stored session even if the server is unreachable.
 *
 * Mirrors the expo plugin's internal `clearSessionCache` (writes `{}` to the
 * cookie/cache keys and resets the in-memory session atom) so a failed
 * sign-out still drops the user back to the login screen.
 */
export async function forceClearLocalSession() {
  await Promise.allSettled([
    SecureStore.setItemAsync(SESSION_COOKIE_KEY, "{}"),
    SecureStore.setItemAsync(SESSION_CACHE_KEY, "{}"),
  ])

  const sessionAtom = authClient.$store.atoms.session
  if (sessionAtom) {
    sessionAtom.set({
      ...sessionAtom.get(),
      data: null,
    })
  }
}
