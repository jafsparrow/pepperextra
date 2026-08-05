import { useCallback, useState } from "react"

import { authClient } from "@/lib/auth-client"

/**
 * Forced password reset flow (first login with an admin-assigned temporary
 * password).
 *
 * better-auth's `changePassword` does not clear `passwordResetRequired`, so we
 * clear it explicitly via `updateUser` after a successful change, then refresh
 * the session so the route gates send the user to `/(tabs)`.
 */
export function useSetPassword() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPassword = useCallback(
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

        const update = await authClient.updateUser({ passwordResetRequired: false })
        if (update.error) {
          throw new Error(update.error.message || "Could not finish setting your password.")
        }

        await authClient.getSession()
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

  return { setPassword, isPending, error }
}
