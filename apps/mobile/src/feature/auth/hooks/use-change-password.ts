import { useCallback, useState } from "react"

import { authClient } from "@/lib/auth-client"

/** Change the current user's password from the settings screen. */
export function useChangePassword() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      setIsPending(true)
      setError(null)
      try {
        const change = await authClient.changePassword({
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          revokeOtherSessions: true,
        })
        if (change.error) {
          throw new Error(change.error.message || "Could not change password.")
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

  return { changePassword, isPending, error }
}
