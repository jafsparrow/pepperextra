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
import { organizationStaffUserCreateInputSchema } from "@pepperextra/contracts"
import type { CreateOrganizationStaffUserDto } from "@pepperextra/contracts"

export type OrgStaffFormValues = CreateOrganizationStaffUserDto

interface OrgStaffFormProps {
  onSubmit?: (data: OrgStaffFormValues) => void | Promise<void>
  onPending?: (pending: boolean) => void
  isLoading?: boolean
  className?: string
  showHeader?: boolean
  title?: string
  description?: string
  defaultValues?: Partial<OrgStaffFormValues>
  noSubmit?: boolean
  onNoSubmit?: (data: OrgStaffFormValues) => void | Promise<void>
  submitLabel?: string
  isEdit?: boolean
}

export function OrgStaffForm({
  onSubmit,
  onPending,
  isLoading = false,
  className,
  showHeader = true,
  title = "Create staff user",
  description = "Add a staff member to this organization.",
  defaultValues,
  noSubmit = false,
  onNoSubmit,
  submitLabel,
  isEdit = false,
}: OrgStaffFormProps) {
  const form = useForm<OrgStaffFormValues>({
    resolver: zodResolver(organizationStaffUserCreateInputSchema),
    defaultValues: {
      organizationId: defaultValues?.organizationId ?? "",
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      organizationId: defaultValues?.organizationId ?? "",
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
    })
  }, [
    defaultValues?.organizationId,
    defaultValues?.email,
    defaultValues?.name,
    form,
  ])

  useEffect(() => {
    onPending?.(form.formState.isSubmitting)
  }, [form.formState.isSubmitting, onPending])

  const handleSubmit = async (data: OrgStaffFormValues) => {
    if (noSubmit) {
      await onNoSubmit?.(data)
      return
    }

    if (onSubmit) {
      await onSubmit(data)
      return
    }

    console.log("Staff user data:", data)
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
                name="organizationId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Organization ID</FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      placeholder="org_123"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      This identifies the organization the staff member belongs
                      to.
                    </FieldDescription>
                  </Field>
                )}
              />

              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Staff member name</FieldLabel>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Alex Johnson"
                      autoComplete="name"
                    />
                    <FieldDescription>
                      Enter the display name for this staff user.
                    </FieldDescription>
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      {...field}
                      type="email"
                      placeholder="alex@example.com"
                      autoComplete="email"
                    />
                    <FieldDescription>
                      Use the email address that will receive their invitation.
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
              {submitLabel ??
                (noSubmit
                  ? "Done"
                  : isEdit
                    ? "Save changes"
                    : "Create staff user")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
