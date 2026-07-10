import { usePermission } from "@/shared/hooks/permission-hook"

export function NavBar() {
  const { isAllowed, isPending } = usePermission({
    user: ["read"],
  })
  return (
    <div>
      Navbar
      <div>is allowed: {isAllowed.toString()}</div>
      <div>is pending: {isPending.toString()}</div>
    </div>
  )
}
