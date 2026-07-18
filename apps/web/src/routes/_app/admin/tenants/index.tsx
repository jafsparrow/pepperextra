import { useAuthorization } from "@/shared/hooks/authorization-hook"
import { usePermission } from "@/shared/hooks/permission-hook"
import { authClient } from "@pepperextra/auth/client"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/_app/admin/tenants/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAllowed, isPending } = usePermission({ system: ["read"] })
  const { hasRole } = useAuthorization()

  const isAdmin = hasRole(["admin"])

  const createOrg = async () => {
    const metadata = { someKey: "someValue" }
    const { data, error } = await authClient.organization.create({
      name: "My Organization", // required
      slug: "my-org", // required
      logo: "https://example.com/logo.png",
      metadata,
      userId: "some_user_id",
      keepCurrentActiveOrganization: false,
    })

    console.log(data, error)
  }
  return (
    <div>
      Tenant list placeholder
      {isAllowed ? "alllowed to sysem read" : "not allowed system read"}
      <div>{isAdmin ? "hell he is admin" : "he fucking not the admin"}</div>
      <div>
        <Link to="/admin/tenants/$tenantId" params={{ tenantId: "lsdkfsdlfj" }}>
          Dawar
        </Link>
      </div>
      <Button onClick={createOrg}>Create org</Button>
    </div>
  )
}
