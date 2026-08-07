import { authClient } from "@/lib/auth-client"

export type UserRole = "owner" | "staff"

/**
 * Role-aware UI gating (BRD §6.3). `customAccountType` separates owners from
 * staff; org-level roles (manager, salesperson, cashier, stationStaff) come
 * from the active organization membership once wired to the organization
 * plugin. Cost visibility is a manager/owner capability.
 */
export function useRole() {
  const { data: session } = authClient.useSession()
  const role: UserRole = session?.user.customAccountType ?? "staff"
  return {
    role,
    isOwner: role === "owner",
    canSeeCosts: role === "owner",
    /**
     * TODO: map to "Owner + Location Manager + salesperson (floor-limited)" per
     * BRD §6.3 / §8.2 once org roles are wired. Owner-only for now.
     */
    canEditPrice: role === "owner",
  }
}
