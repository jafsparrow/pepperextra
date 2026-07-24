import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Users, Plus, ChevronDown, ChevronUp, Shield, Mail } from "lucide-react"
import { authClient } from "@pepperextra/auth/client"
import { OrgStaffModal } from "./org-staff-modal"

interface OrgStaffListProps {
  orgId: string | undefined
}

export function OrgStaffList({ orgId }: OrgStaffListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const queryClient = useQueryClient()

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ["organisation-members", orgId],
    queryFn: async () => {
      const res = await authClient.organization.listMembers({
        query: {
          filterField: "role",
          filterOperator: "ne",
          filterValue: "owner", // Exclude owner to focus on staff members
        },
      })
      if (res.error) {
        throw new Error(res.error.message)
      }
      return res.data.members
    },
    enabled: !!orgId,
  })

  const members = membersRes || []
  const initialLimit = 3
  const visibleMembers = isExpanded ? members : members.slice(0, initialLimit)

  const handleStaffSuccess = () => {
    // Refresh the list after staff creation
    queryClient.invalidateQueries({
      queryKey: ["organisation-members", orgId],
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "manager":
        return "default"
      case "cashier":
        return "secondary"
      case "staff":
      default:
        return "outline"
    }
  }

  return (
    <Card className="shadow-lg border border-border/40 backdrop-blur-sm bg-card/80 transition-all duration-300 hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Staff Members
          </CardTitle>
          <CardDescription>
            Manage role permissions and staff working for this organization.
          </CardDescription>
        </div>
        {orgId && (
          <OrgStaffModal onSubmit={handleStaffSuccess}>
            <Button size="sm" className="gap-1 shadow-sm transition-transform active:scale-95">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </OrgStaffModal>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full bg-muted/60 animate-pulse rounded-lg" />
            <div className="h-14 w-full bg-muted/60 animate-pulse rounded-lg" />
            <div className="h-14 w-full bg-muted/60 animate-pulse rounded-lg" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg border-muted-foreground/30 bg-muted/20">
            <Users className="h-10 w-10 text-muted-foreground mb-2 stroke-[1.5]" />
            <h3 className="font-semibold text-sm">No staff members</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Add your first staff user to assign Cashier, Manager or Staff roles.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMembers.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/60 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border/60">
                    <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs">
                      {getInitials(item.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm text-foreground flex items-center gap-1.5">
                      {item.user.name}
                      {item.role === "owner" && (
                        <Shield className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />
                      {item.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(item.role)} className="capitalize text-xs font-semibold px-2">
                    {item.role}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold px-3 text-muted-foreground hover:text-foreground">
                    Edit
                  </Button>
                </div>
              </div>
            ))}

            {members.length > initialLimit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-2 text-xs flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    View Less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    View More ({members.length - initialLimit} more) <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
