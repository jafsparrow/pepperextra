import { OrgAddModal } from "@/feature/org/ui/components/org-add-modal"
import { authClient } from "@pepperextra/auth/client"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/_app/org/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = authClient.useListOrganizations()
  const { data: userData } = authClient.useSession()

  const handleCreateOrganisation = async () => {
    const { data, error } = await authClient.organization.create({
      name: "dawar",
      slug: "dawar-ind",
    })
  }
  return (
    <div>
      Hello "/org/"!
      <div>{JSON.stringify(data)}</div>
      <Button variant={"outline"} onClick={handleCreateOrganisation}>
        add a new org
      </Button>
      <div className="text-4xl font-bold">{JSON.stringify(userData)}</div>
      <div>
        <OrgAddModal />
      </div>
    </div>
  )
}
