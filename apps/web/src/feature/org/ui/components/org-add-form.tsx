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

const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
})

export type OrganizationFormValues = z.infer<typeof organizationSchema>

interface OrgAddFormProps {
  onSubmit?: (data: OrganizationFormValues) => void | Promise<void>
  onPending?: (pending: boolean) => void
  isLoading?: boolean
  className?: string
  showHeader?: boolean
  title?: string
  description?: string
}

export function OrgAddForm({
  onSubmit,
  onPending,
  isLoading = false,
  className,
  showHeader = true,
  title = "Create organization",
  description = "Add the organization name and a unique slug to get started.",
}: OrgAddFormProps) {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  })

  useEffect(() => {
    onPending?.(form.formState.isSubmitting)
  }, [form.formState.isSubmitting, onPending])

  const handleSubmit = async (data: OrganizationFormValues) => {
    if (onSubmit) {
      await onSubmit(data)
      return
    }

    console.log("Organization data:", data)
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
                    <FieldLabel>Organization name</FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Acme Labs"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      This is the display name shown to your team.
                    </FieldDescription>
                  </Field>
                )}
              />

              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Slug</FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      placeholder="acme-labs"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Use lowercase letters, numbers, and hyphens only.
                    </FieldDescription>
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting || isLoading
                ? "Creating..."
                : "Create organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
