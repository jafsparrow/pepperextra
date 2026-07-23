import { useMemo, useState } from "react"
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
import { OrgStaffForm } from "./org-staff-form"
import type { OrgStaffFormValues } from "./org-staff-form"
import { useMutation } from "@tanstack/react-query"
import { orpc } from "@/shared/utils/orpc"

interface OrgStaffModalProps {
  children?: ReactNode
  onSubmit?: (data: OrgStaffFormValues) => void | Promise<void>
  onOpenChange?: (open: boolean) => void
  open?: boolean
  defaultButtonLabel?: string
  title?: string
  description?: string
  initialValues?: Partial<OrgStaffFormValues>
  noSubmit?: boolean
  onNoSubmit?: (data: OrgStaffFormValues) => void | Promise<void>
  submitLabel?: string
  isEdit?: boolean
}

export function OrgStaffModal({
  children,
  onSubmit,
  onOpenChange,
  open,
  defaultButtonLabel = "Add staff",
  title,
  description,
  initialValues,
  noSubmit = false,
  onNoSubmit,
  submitLabel,
  isEdit = false,
}: OrgStaffModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const staffCreateMutation = useMutation(
    orpc.organizationStaffUser.create.mutationOptions({
      onSuccess: (data) => {
        console.log("success")
      },
      onError: (error) => {
        console.log("error happened")
      },
    })
  )
  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const handleSubmit = async (data: OrgStaffFormValues) => {
    try {
      console.log("staff data is ", data)
      await onSubmit?.(data)
      staffCreateMutation.mutate(data)
      handleOpenChange(false)
      toast.success(isEdit ? "Staff user updated." : "Staff user created.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      )
    }
  }

  const modalTitle = useMemo(
    () => title ?? (isEdit ? "Edit staff user" : "Create staff user"),
    [isEdit, title]
  )
  const modalDescription = useMemo(
    () =>
      description ??
      (isEdit
        ? "Update this staff member's details."
        : "Add a staff member to this organization."),
    [description, isEdit]
  )

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
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <OrgStaffForm
          onSubmit={handleSubmit}
          showHeader={false}
          defaultValues={initialValues}
          noSubmit={noSubmit}
          onNoSubmit={onNoSubmit}
          submitLabel={submitLabel}
          isEdit={isEdit}
        />
      </DialogContent>
    </Dialog>
  )
}
