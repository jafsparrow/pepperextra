import { useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BranchAddForm } from "./branch-add-form"
import type { BranchFormValues } from "../../schema"
import { authClient } from "@pepperextra/auth/client"
import { BRANCH_QUERY_KEYS } from "../../constants"

interface BranchAddModalProps {
  children?: ReactNode
  onSubmit?: (data: BranchFormValues) => void | Promise<void>
  onOpenChange?: (open: boolean) => void
  open?: boolean
  defaultButtonLabel?: string
  orgId?: string
}

export function BranchAddModal({
  children,
  onSubmit,
  onOpenChange,
  open,
  defaultButtonLabel = "Add Branch",
  orgId,
}: BranchAddModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const queryClient = useQueryClient()

  const isOpen = open ?? internalOpen

  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormValues) => {
      const { data: newTeam, error } = await authClient.organization.createTeam({
        name: data.name,
      })

      if (error) {
        throw new Error(error.message)
      }

      return newTeam
    },
    onSuccess: () => {
      toast.success("Created branch successfully.")
      // Invalidate branch list query to refresh UI
      queryClient.invalidateQueries({
        queryKey: BRANCH_QUERY_KEYS.list(orgId),
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const handleSubmit = async (data: BranchFormValues) => {
    createBranchMutation.mutate(data)
    await onSubmit?.(data)
    handleOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">{defaultButtonLabel}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
          <DialogDescription>
            Add a new restaurant location for this organization.
          </DialogDescription>
        </DialogHeader>

        <BranchAddForm
          onSubmit={handleSubmit}
          showHeader={false}
          isLoading={createBranchMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
