import { useQuery } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Store, Layers } from "lucide-react"

interface BranchScopeSelectorProps {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
}

export function BranchScopeSelector({
  value,
  onValueChange,
}: BranchScopeSelectorProps) {
  const { data: teams, isLoading } = useQuery({
    queryKey: ["branch-scope-teams"],
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })

  const handleChange = (v: string) => {
    onValueChange(v === "all" ? undefined : v)
  }

  return (
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-muted-foreground" />
      <Select
        value={value ?? "all"}
        onValueChange={handleChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <Store className="h-3.5 w-3.5" />
              All branches
            </span>
          </SelectItem>
          {(teams ?? []).map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
