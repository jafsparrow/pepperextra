import { authClient } from "@pepperextra/auth/client"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/_app/org/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = authClient.useListOrganizations()
  const {} = authClient.getSession()

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
    </div>
  )
}
