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
import { OrgAddForm } from "./org-add-form"
import type { OrganizationFormValues } from "./org-add-form"
import { useMutation } from "@tanstack/react-query"
import { authClient } from "@pepperextra/auth/client"

interface OrgAddModalProps {
  children?: ReactNode
  onSubmit?: (data: OrganizationFormValues) => void | Promise<void>
  onOpenChange?: (open: boolean) => void
  open?: boolean
  defaultButtonLabel?: string
}

export function OrgAddModal({
  children,
  onSubmit,
  onOpenChange,
  open,
  defaultButtonLabel = "Add org",
}: OrgAddModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = open ?? internalOpen
  const createOrgMutation = useMutation({
    mutationFn: async (data: OrganizationFormValues) => {
      await authClient.organization.create({ ...data })
    },
    onSuccess: () => {
      toast.success("Created Oganisation succesfully..")
    },
    onError: () => {},
  })
  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const handleSubmit = async (data: OrganizationFormValues) => {
    createOrgMutation.mutate(data)
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
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Add your organization name and a unique slug to get started.
          </DialogDescription>
        </DialogHeader>

        <OrgAddForm
          onSubmit={handleSubmit}
          showHeader={false}
          isLoading={createOrgMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
