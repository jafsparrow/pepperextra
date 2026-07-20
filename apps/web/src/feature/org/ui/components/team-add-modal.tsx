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
import { useMutation } from "@tanstack/react-query"
import { TeamAddForm } from "./team-add-form"
import type { TeamFormValues } from "./team-add-form"
import { authClient } from "@pepperextra/auth/client"

interface TeamAddModalProps {
  children?: ReactNode
  onSubmit?: (data: TeamFormValues) => void | Promise<void>
  onOpenChange?: (open: boolean) => void
  open?: boolean
  defaultButtonLabel?: string
}

export function TeamAddModal({
  children,
  onSubmit,
  onOpenChange,
  open,
  defaultButtonLabel = "Add team",
}: TeamAddModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = open ?? internalOpen
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      const { data: newTeam, error } = await authClient.organization.createTeam(
        {
          name: data.name,
        }
      )

      if (error) {
        console.log(error)
        // React Query will handle this as an error
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      toast.success("Created team successfully.")
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

  const handleSubmit = async (data: TeamFormValues) => {
    createTeamMutation.mutate({ ...data })
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
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Add a team name to organize your workspace.
          </DialogDescription>
        </DialogHeader>

        <TeamAddForm
          onSubmit={handleSubmit}
          showHeader={false}
          isLoading={createTeamMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
