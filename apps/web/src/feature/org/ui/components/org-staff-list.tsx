import { useState, useMemo } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"
import {
  Search,
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  Shield,
  Mail,
  MoreHorizontal,
  Pencil,
  Key,
  Ban,
  Copy,
} from "lucide-react"
import { authClient } from "@repo/auth/client"
import { OrgStaffModal } from "./org-staff-modal"
import { orpc } from "@/shared/utils/orpc"
import { toast } from "sonner"

interface OrgStaffListProps {
  orgId: string | undefined
}

export function OrgStaffList({ orgId }: OrgStaffListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeamId, setSelectedTeamId] = useState("all")
  const queryClient = useQueryClient()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<{
    id: string
    userId: string
    role: string
    name: string
    email: string
  } | null>(null)
  const [editRole, setEditRole] = useState("staff")

  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [resetPasswordMember, setResetPasswordMember] = useState<{
    id: string
    userId: string
    name: string
  } | null>(null)
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(
    null
  )

  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banMember, setBanMember] = useState<{
    id: string
    userId: string
    name: string
  } | null>(null)
  const [banReason, setBanReason] = useState("")

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ["organisation-members", orgId],
    queryFn: async () => {
      const res = await authClient.organization.listMembers({
        query: {
          filterField: "role",
          filterOperator: "ne",
          filterValue: "owner",
        },
      })
      if (res.error) {
        throw new Error(res.error.message)
      }
      return res.data.members
    },
    enabled: !!orgId,
  })

  const { data: teamsData } = useQuery({
    queryKey: ["organisation-teams", orgId],
    queryFn: async () => {
      const res = await authClient.organization.listTeams()
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!orgId,
  })
  const teams = teamsData ?? []

  const { data: userTeamMap } = useQuery({
    queryKey: ["organisation-user-team-map", orgId],
    queryFn: async () => {
      const teamsRes = await authClient.organization.listTeams()
      if (teamsRes.error) throw new Error(teamsRes.error.message)
      const allTeams = teamsRes.data
      const map: Record<string, string[]> = {}
      await Promise.all(
        allTeams.map(async (team) => {
          const tmsRes = await authClient.organization.listTeamMembers({
            query: { teamId: team.id },
          })
          if (!tmsRes.error) {
            tmsRes.data.forEach((tm: { userId: string }) => {
              ;(map[tm.userId] ??= []).push(team.id)
            })
          }
        })
      )
      return map
    },
    enabled: !!orgId,
  })

  const members = membersRes || []

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (selectedTeamId !== "all") {
        const memberTeamIds = userTeamMap?.[member.userId]
        if (!memberTeamIds?.includes(selectedTeamId)) {
          if (member.userId !== selectedTeamId) return false
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = member.user.name.toLowerCase()
        const email = member.user.email.toLowerCase()
        if (!name.includes(q) && !email.includes(q)) return false
      }
      return true
    })
  }, [members, selectedTeamId, userTeamMap, searchQuery])

  const initialLimit = 3
  const visibleMembers = isExpanded
    ? filteredMembers
    : filteredMembers.slice(0, initialLimit)

  const handleStaffSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["organisation-members", orgId],
    })
  }

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string
      role: string
    }) => {
      const res = await authClient.organization.updateMemberRole({
        memberId,
        role,
      })
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organisation-members", orgId],
      })
      toast.success("Staff role updated")
      setEditDialogOpen(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role"
      )
    },
  })

  const resetPasswordMutation = useMutation(
    orpc.organizationStaffUser.resetPassword.mutationOptions({
      onSuccess: (data) => {
        setResetPasswordResult(data.temporaryPassword)
        toast.success("Password reset successfully")
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to reset password"
        )
      },
    })
  )

  const banMutation = useMutation(
    orpc.organizationStaffUser.ban.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["organisation-members", orgId],
        })
        toast.success("Staff user banned")
        setBanDialogOpen(false)
        setBanReason("")
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to ban user"
        )
      },
    })
  )

  const openEdit = (member: (typeof members)[0]) => {
    setEditMember({
      id: member.id,
      userId: member.userId,
      role: member.role,
      name: member.user.name,
      email: member.user.email,
    })
    setEditRole(member.role)
    setEditDialogOpen(true)
  }

  const openResetPassword = (member: (typeof members)[0]) => {
    setResetPasswordMember({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
    })
    setResetPasswordResult(null)
    setResetPasswordDialogOpen(true)
  }

  const openBan = (member: (typeof members)[0]) => {
    setBanMember({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
    })
    setBanReason("")
    setBanDialogOpen(true)
  }

  const handleResetPassword = () => {
    if (!resetPasswordMember || !orgId) return
    resetPasswordMutation.mutate({
      organizationId: orgId,
      userId: resetPasswordMember.userId,
    })
  }

  const handleBan = () => {
    if (!banMember || !orgId) return
    banMutation.mutate({
      organizationId: orgId,
      id: banMember.userId,
      reason: banReason || undefined,
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
      case "branch_manager":
        return "default"
      case "cashier":
      case "salesperson":
        return "secondary"
      case "staff":
      default:
        return "outline"
    }
  }

  return (
    <Card className="border border-border/40 bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Users className="h-5 w-5 text-primary" />
            Staff Members
          </CardTitle>
          <CardDescription>
            Manage role permissions and staff working for this organization.
          </CardDescription>
        </div>
        {orgId && (
          <OrgStaffModal onSubmit={handleStaffSuccess}>
            <Button
              size="sm"
              className="gap-1 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </OrgStaffModal>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsExpanded(false)
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedTeamId}
            onValueChange={(v) => {
              setSelectedTeamId(v)
              setIsExpanded(false)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center">
            <Users className="mb-2 h-10 w-10 stroke-[1.5] text-muted-foreground" />
            <h3 className="text-sm font-semibold">No staff members found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery || selectedTeamId !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Add your first staff user to assign Cashier, Manager or Staff roles."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMembers.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3 transition-all duration-200 hover:bg-muted/60"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border/60">
                    <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                      {getInitials(item.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {item.user.name}
                      {item.role === "owner" && (
                        <Shield className="h-3.5 w-3.5 fill-amber-500/20 text-amber-500" />
                      )}
                    </h4>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {item.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getRoleBadgeVariant(item.role)}
                    className="px-2 text-xs font-semibold capitalize"
                  >
                    {item.role}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetPassword(item)}>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openBan(item)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Ban User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredMembers.length > initialLimit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    View Less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    View More ({filteredMembers.length - initialLimit} more){" "}
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Role</DialogTitle>
            <DialogDescription>
              Change the role for {editMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="branch_manager">Branch Manager</SelectItem>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                  <SelectItem value="station_staff">Station Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() =>
                editMember &&
                updateRoleMutation.mutate({
                  memberId: editMember.id,
                  role: editRole,
                })
              }
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {resetPasswordMember?.name}. A new temporary
              password will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {resetPasswordResult ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-muted p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Temporary Password
                  </p>
                  <p className="font-mono text-sm font-semibold break-all">
                    {resetPasswordResult}
                  </p>
                </div>
                <Button
                  className="w-full gap-2"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(resetPasswordResult ?? "")
                    toast.success("Password copied to clipboard")
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <p className="text-xs text-muted-foreground">
                  Share this password securely with the staff member. They will
                  be prompted to change it on next login.
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setResetPasswordDialogOpen(false)}
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  This will generate a new temporary password and invalidate the
                  current one.
                </p>
                <Button
                  className="w-full"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? "Resetting..."
                    : "Reset Password"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ban Staff User</DialogTitle>
            <DialogDescription>
              Ban {banMember?.name} from accessing this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                placeholder="Enter reason for ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBan}
                disabled={banMutation.isPending}
              >
                {banMutation.isPending ? "Banning..." : "Ban User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
