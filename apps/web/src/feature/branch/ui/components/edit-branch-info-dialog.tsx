import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { branchInfoUpdateSchema } from "@pepperextra/contracts"
import type { BranchInfoUpdate } from "@pepperextra/contracts"
import { orpc } from "@/shared/utils/orpc"

interface EditBranchInfoDialogProps {
  teamId: string
  defaultName: string
  defaultTagline?: string | null
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditBranchInfoDialog({
  teamId,
  defaultName,
  defaultTagline,
  children,
  open,
  onOpenChange,
}: EditBranchInfoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const queryClient = useQueryClient()

  const isOpen = open ?? internalOpen

  const form = useForm<BranchInfoUpdate>({
    resolver: zodResolver(branchInfoUpdateSchema),
    defaultValues: {
      name: defaultName,
      tagline: defaultTagline ?? "",
    },
  })

  useEffect(() => {
    form.reset({ name: defaultName, tagline: defaultTagline ?? "" })
  }, [defaultName, defaultTagline, form])

  const updateInfoMutation = useMutation(
    orpc.branchProfile.updateInfo.mutationOptions({
      onSuccess: () => {
        toast.success("Branch info updated")
        queryClient.invalidateQueries({ queryKey: ["team-name", teamId] })
        handleOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }),
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const handleSubmit = (data: BranchInfoUpdate) => {
    updateInfoMutation.mutate({
      teamId,
      name: data.name,
      tagline: data.tagline || null,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Edit Info
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Branch Info</DialogTitle>
          <DialogDescription>
            Update the branch name and tagline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Branch Name</FieldLabel>
                  <Input {...field} value={field.value ?? ""} type="text" placeholder="Branch name" />
                </Field>
              )}
            />
            <Controller
              name="tagline"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Tagline / Caption</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. Fresh ingredients, bold flavors"
                    rows={2}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateInfoMutation.isPending ||
                !form.formState.isValid ||
                !form.formState.isDirty
              }
            >
              {updateInfoMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
