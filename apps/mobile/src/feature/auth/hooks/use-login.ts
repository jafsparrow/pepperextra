import { useCallback, useState } from "react"

import { signIn } from "@/lib/auth-client"

/**
 * Sign in with email + password.
 *
 * On success the root route gates re-render from the session store and route
 * to `/(tabs)` or `/set-password` (forced reset), so no manual navigation is
 * needed here.
 */
export function useLogin() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      setIsPending(true)
      setError(null)
      try {
        const { error: authError } = await signIn.email(credentials)
        if (authError) {
          throw new Error(authError.message || "Invalid email or password.")
        }
        return true
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong.")
        return false
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  return { login, isPending, error }
}
