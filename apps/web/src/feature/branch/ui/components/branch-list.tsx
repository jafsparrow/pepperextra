import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { MapPin, Plus, Store, ChevronDown, ChevronUp } from "lucide-react"
import { authClient } from "@pepperextra/auth/client"
import { BRANCH_QUERY_KEYS } from "../../constants"
import { BranchAddModal } from "./branch-add-modal"

interface BranchListProps {
  orgId: string | undefined
}

export function BranchList({ orgId }: BranchListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: teamsRes, isLoading } = useQuery({
    queryKey: BRANCH_QUERY_KEYS.list(orgId),
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) {
        throw new Error(res.error.message)
      }
      return res.data;
    },
    enabled: !!orgId,
  })

  const branches = teamsRes || []
  const initialLimit = 3
  const visibleBranches = isExpanded ? branches : branches.slice(0, initialLimit)

  return (
    <Card className="shadow-lg border border-border/40 backdrop-blur-sm bg-card/80 transition-all duration-300 hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Branch Locations
          </CardTitle>
          <CardDescription>
            Manage the branches and locations for your restaurant brand.
          </CardDescription>
        </div>
        {orgId && (
          <BranchAddModal orgId={orgId}>
            <Button size="sm" className="gap-1 shadow-sm transition-transform active:scale-95">
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </BranchAddModal>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full bg-muted/60 animate-pulse rounded-lg" />
            <div className="h-14 w-full bg-muted/60 animate-pulse rounded-lg" />
            <div className="h-14 w-full bg-muted/60 animate-pulse rounded-lg" />
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg border-muted-foreground/30 bg-muted/20">
            <MapPin className="h-10 w-10 text-muted-foreground mb-2 stroke-[1.5]" />
            <h3 className="font-semibold text-sm">No branches found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Add your first branch location to start organizing teams in your restaurant.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBranches.map((branch) => (
              <div
                key={branch.id}
                className="group flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/60 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground duration-200">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground">{branch.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Better Auth Team ID: <code className="text-[10px] px-1 py-0.5 rounded bg-muted font-mono">{branch.id.slice(0, 8)}...</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2 py-0">
                    Active
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold px-3 text-muted-foreground hover:text-foreground">
                    Manage
                  </Button>
                </div>
              </div>
            ))}

            {branches.length > initialLimit && (
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
                    View More ({branches.length - initialLimit} more) <ChevronDown className="h-3 w-3" />
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
