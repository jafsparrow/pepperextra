// hooks/use-session.ts
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data, error } = await authClient.getSession()
      if (error) throw new Error(error.message)
      return data // Returns { user, session } or null
    },
    staleTime: 1000 * 60 * 5, // Cache session data for 5 minutes
  })
}
