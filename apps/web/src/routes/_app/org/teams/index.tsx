import { useAuthorization } from "@/shared/hooks/authorization-hook"
import { usePermission } from "@/shared/hooks/permission-hook"
import { authClient } from "@pepperextra/auth/client"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { TeamAddModal } from "@/feature/org/ui/components/team-add-modal"
import { useQuery } from "@tanstack/react-query"

import { contracts } from "@pepperextra/contracts"
import { orpc } from "@/shared/utils/orpc"

export const Route = createFileRoute("/_app/org/teams/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAllowed, isPending } = usePermission({ system: ["read"] })
  const { hasRole } = useAuthorization()
  const { data: activeorg } = authClient.useActiveOrganization()
  const { data: galaxies } = useQuery(
    orpc.planet.list.queryOptions({ input: { cursor: 1 } })
  )
  const isAdmin = hasRole(["admin"])

  const handleActiveOrg = async () => {
    await authClient.organization.inviteMember({
      email: "salu@gmail.com",
      role: "cashier",
    })

    authClient.organization.setActive({
      organizationId: "PZskoUOynNZ9H9p0Ljq7ODpWMbCXrPPg",
    })
  }

  const handleAcceptInvitation = async () => {
    authClient.organization.acceptInvitation({
      invitationId: "w5vlxcbg8iLx7oRcChJvCP0scDzNzBka",
    })
  }
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
      <Button onClick={handleActiveOrg}>Activate org</Button>
      <div>{JSON.stringify(activeorg)}</div>
      <TeamAddModal />
      <Button onClick={handleAcceptInvitation}>Accpt Ivtation</Button>
      <hr />
      <div>{JSON.stringify(galaxies)}</div>
    </div>
  )
}
