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
import { branchProfileUpdateSchema } from "@pepperextra/contracts"
import { orpc } from "@/shared/utils/orpc"

const addressFormSchema = branchProfileUpdateSchema.pick({
  address: true,
  location: true,
})
type AddressFormValues = {
  address?: string | null
  location?: string | null
}

interface EditAddressDialogProps {
  teamId: string
  defaultAddress?: string | null
  defaultLocation?: string | null
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditAddressDialog({
  teamId,
  defaultAddress,
  defaultLocation,
  children,
  open,
  onOpenChange,
}: EditAddressDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const queryClient = useQueryClient()

  const isOpen = open ?? internalOpen

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      address: defaultAddress ?? "",
      location: defaultLocation ?? "",
    },
  })

  useEffect(() => {
    form.reset({ address: defaultAddress ?? "", location: defaultLocation ?? "" })
  }, [defaultAddress, defaultLocation, form])

  const updateMutation = useMutation(
    orpc.branchProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Address updated")
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

  const handleSubmit = (data: AddressFormValues) => {
    updateMutation.mutate({
      teamId,
      address: data.address || null,
      location: data.location || null,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Edit Address
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Address & Location</DialogTitle>
          <DialogDescription>
            Update the branch address and map coordinates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="address"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Address</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="123 Main Street, Downtown, City 12345"
                    rows={2}
                  />
                </Field>
              )}
            />
            <Controller
              name="location"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Map Coordinates</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="text"
                    placeholder="e.g. 25.2048,55.2708"
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
