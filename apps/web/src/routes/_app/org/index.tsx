import { OrgAddModal } from "@/feature/org/ui/components/org-add-modal"
import { OrgStaffModal } from "@/feature/org/ui/components/org-staff-modal"
import { authClient } from "@pepperextra/auth/client"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/_app/org/")({
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = authClient.useListOrganizations()
  const { data: userData } = authClient.useSession()
  const { data: orgUserList, isLoading } = useQuery({
    queryKey: ["organistation", "id"],
    queryFn: async () =>
      await authClient.organization.listMembers({
        query: {
          filterField: "role",
          filterOperator: "ne",
          filterValue: "owner",
        },
      }),
  })

  const handleCreateOrganisation = async () => {
    // const { data, error } = await authClient.organization.create({
    //   name: "dawar",
    //   slug: "dawar-ind",
    // })
  }
  return (
    <div>
      Hello "/org/"!
      {/* <div>{JSON.stringify(data)}</div> */}
      <div>
        {orgUserList?.data?.members.map((user, index) => (
          <div key={index}>
            <div>
              {" "}
              {user.user.name} - {user.role}
            </div>
          </div>
        ))}
      </div>
      <Button variant={"outline"} onClick={handleCreateOrganisation}>
        add a new org
      </Button>
      {/* <div className="text-4xl font-bold">{JSON.stringify(userData)}</div> */}
      <div>
        <OrgAddModal />
      </div>
      <div className="mt-4">
        <OrgStaffModal />
      </div>
    </div>
  )
}
