import { useRouter } from "expo-router"
import { useCallback, useState } from "react"

import { forceClearLocalSession, signOut } from "@/lib/auth-client"

/** Sign the current user out and return to the login screen. */
export function useSignOut() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signOutUser = useCallback(async () => {
    setIsPending(true)
    setError(null)
    try {
      const { error: authError } = await signOut()
      if (authError) {
        throw new Error(authError.message || "Could not sign out.")
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
    } finally {
      // Force-logout: clear the local session even if the server call failed,
      // then always return to the login screen.
      await forceClearLocalSession()
      router.replace("/login")
      setIsPending(false)
    }
  }, [router])

  return { signOutUser, isPending, error }
}
