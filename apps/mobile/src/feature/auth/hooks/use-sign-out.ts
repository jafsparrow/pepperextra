import { useRouter } from "expo-router"
import { useCallback, useState } from "react"

import { signOut } from "@/lib/auth-client"

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
      router.replace("/login")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.")
    } finally {
      setIsPending(false)
    }
  }, [router])

  return { signOutUser, isPending, error }
}
