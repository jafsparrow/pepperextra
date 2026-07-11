import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"

export function useLoginMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    // 1. The core operation payload calling the Better-Auth Client SDK
    mutationFn: async (
      credentials: Parameters<typeof authClient.signIn.email>[0]
    ) => {
      const { data, error } = await authClient.signIn.email(credentials)

      // Better-Auth returns an error object; throw it so TanStack Query registers it as a failure
      if (error) {
        throw new Error(error.message || "Invalid authentication credentials.")
      }

      return data
    },

    // 2. Clear caches and redirect clean layout spaces on success
    onSuccess: async () => {
      // Invalidate the global 'session' query so your app layout immediately registers the logged-in user
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] })

      // Type-safe routing shift to dashboard layout
      await navigate({ to: "/", replace: true })
    },
  })
}
