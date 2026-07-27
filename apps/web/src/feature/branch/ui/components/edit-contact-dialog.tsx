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
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { branchProfileUpdateSchema } from "@pepperextra/contracts"
import { orpc } from "@/shared/utils/orpc"

const contactFormSchema = branchProfileUpdateSchema.pick({
  phone: true,
  email: true,
})
type ContactFormValues = {
  phone?: string | null
  email?: string | null
}

interface EditContactDialogProps {
  teamId: string
  defaultPhone?: string | null
  defaultEmail?: string | null
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditContactDialog({
  teamId,
  defaultPhone,
  defaultEmail,
  children,
  open,
  onOpenChange,
}: EditContactDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const queryClient = useQueryClient()

  const isOpen = open ?? internalOpen

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      phone: defaultPhone ?? "",
      email: defaultEmail ?? "",
    },
  })

  useEffect(() => {
    form.reset({ phone: defaultPhone ?? "", email: defaultEmail ?? "" })
  }, [defaultPhone, defaultEmail, form])

  const updateMutation = useMutation(
    orpc.branchProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Contact info updated")
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

  const handleSubmit = (data: ContactFormValues) => {
    updateMutation.mutate({
      teamId,
      phone: data.phone || null,
      email: data.email || null,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Edit Contact
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Contact Info</DialogTitle>
          <DialogDescription>
            Update the branch phone number and email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Phone</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    placeholder="branch@restaurant.com"
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
                updateMutation.isPending ||
                !form.formState.isDirty
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
