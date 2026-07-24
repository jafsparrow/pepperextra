import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { branchSchema, type BranchFormValues } from "../../schema"

interface BranchAddFormProps {
  onSubmit?: (data: BranchFormValues) => void | Promise<void>
  onPending?: (pending: boolean) => void
  isLoading?: boolean
  className?: string
  showHeader?: boolean
  title?: string
  description?: string
}

export function BranchAddForm({
  onSubmit,
  onPending,
  isLoading = false,
  className,
  showHeader = true,
  title = "Create Branch",
  description = "Add a brand new branch location to mini-McDonald's.",
}: BranchAddFormProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
    },
  })

  useEffect(() => {
    onPending?.(form.formState.isSubmitting)
  }, [form.formState.isSubmitting, onPending])

  const handleSubmit = async (data: BranchFormValues) => {
    if (onSubmit) {
      await onSubmit(data)
      return
    }
    console.log("Branch data:", data)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        {showHeader ? (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        ) : null}
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Branch Name / Location</FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      placeholder="e.g. New York - Times Square"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      This represents a branch/location (handled via Teams in Better Auth).
                    </FieldDescription>
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                form.formState.isSubmitting ||
                !form.formState.isValid
              }
            >
              {form.formState.isSubmitting || isLoading
                ? "Creating..."
                : "Create Branch"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
