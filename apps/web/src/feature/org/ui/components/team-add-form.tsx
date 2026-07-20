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
import * as z from "zod"

const teamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters"),
})

export type TeamFormValues = z.infer<typeof teamSchema>

interface TeamAddFormProps {
  onSubmit?: (data: TeamFormValues) => void | Promise<void>
  onPending?: (pending: boolean) => void
  isLoading?: boolean
  className?: string
  showHeader?: boolean
  title?: string
  description?: string
}

export function TeamAddForm({
  onSubmit,
  onPending,
  isLoading = false,
  className,
  showHeader = true,
  title = "Create team",
  description = "Add a clear team name to get started.",
}: TeamAddFormProps) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
    },
  })

  useEffect(() => {
    onPending?.(form.formState.isSubmitting)
  }, [form.formState.isSubmitting, onPending])

  const handleSubmit = async (data: TeamFormValues) => {
    if (onSubmit) {
      await onSubmit(data)
      return
    }

    console.log("Team data:", data)
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
                    <FieldLabel>Team name</FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Product"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      This is the name your members will see in the workspace.
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
                : "Create team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
