import { useState } from "react"
import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "sonner"
import { z } from "zod"
import { orpc } from "@/shared/utils/orpc"
import type { Product } from "@repo/contracts"

const notesFormSchema = z
  .object({
    needsNotes: z.boolean(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.needsNotes) return
    if (!data.notes || data.notes.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notes"],
        message: "Enter the note to add to quotation & invoice lines",
      })
    }
  })

type NotesFormValues = z.infer<typeof notesFormSchema>

interface ProductNotesDialogProps {
  orgId: string
  product: Product
  children?: ReactNode
}

export function ProductNotesDialog({
  orgId,
  product,
  children,
}: ProductNotesDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<NotesFormValues>({
    resolver: zodResolver(notesFormSchema),
    defaultValues: {
      needsNotes: product.needsNotes,
      notes: product.notes ?? "",
    },
  })

  const needsNotes = form.watch("needsNotes")

  const updateMutation = useMutation(
    orpc.product.update.mutationOptions({
      onSuccess: () => {
        toast.success("Notes settings updated")
        queryClient.invalidateQueries({ queryKey: ["product"] })
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: NotesFormValues) => {
    updateMutation.mutate({
      organizationId: orgId,
      id: product.id,
      needsNotes: data.needsNotes,
      notes: data.needsNotes ? data.notes?.trim() : "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            Manage notes
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Line notes</DialogTitle>
          <DialogDescription>
            When enabled, this note is automatically added to {product.name}{" "}
            quotation &amp; invoice lines so staff see it without fail.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <FieldGroup>
            <Controller
              name="needsNotes"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Add automatic notes to quotation &amp; invoice lines
                </label>
              )}
            />
          </FieldGroup>

          {needsNotes && (
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Note</FieldLabel>
                  <Textarea
                    {...field}
                    placeholder="Record serial number for warranty..."
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                  <FieldDescription>
                    Shown on the line when this product is added to a
                    quotation or invoice.
                  </FieldDescription>
                </Field>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              updateMutation.isPending ||
              form.formState.isSubmitting ||
              !form.formState.isValid
            }
          >
            {updateMutation.isPending ? "Saving..." : "Save notes settings"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
