import { queryOptions, useQuery } from "@tanstack/react-query"

export const deploymentModeQueryOptions = queryOptions({
  queryKey: ["deployment-mode"] as const,
  queryFn: async () => {
    const getMode = () => {
      // 1. Check client-side Vite environment variable
      if (typeof import.meta !== "undefined" && import.meta.env.VITE_DEPLOYMENT_MODE) {
        return import.meta.env.VITE_DEPLOYMENT_MODE.toLowerCase() === "cloud" ? "cloud" : "local"
      }
      // 2. Fall back to process.env (useful for server-side render / Node environments)
      if (typeof process !== "undefined" && process.env.DEPLOYMENT_MODE) {
        return process.env.DEPLOYMENT_MODE.toLowerCase() === "cloud" ? "cloud" : "local"
      }
      return "local"
    }
    return getMode()
  },
  staleTime: Infinity,
  gcTime: Infinity,
})

export function useDeploymentMode() {
  const { data } = useQuery(deploymentModeQueryOptions)
  return {
    mode: data || "local",
    isLocal: (data || "local") === "local",
    isCloud: data === "cloud",
  }
}
