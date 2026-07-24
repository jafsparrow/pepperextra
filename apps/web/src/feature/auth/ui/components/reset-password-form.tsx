import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import * as z from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"

import { Input } from "@workspace/ui/components/input"
import { Link } from "@tanstack/react-router"

const resetSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    verifyPassword: z.string().min(6, "Please verify your new password"),
  })
  .refine((data) => data.newPassword === data.verifyPassword, {
    path: ["verifyPassword"],
    message: "Passwords do not match",
  })

type ResetFormValues = z.infer<typeof resetSchema>

interface ResetPasswordFormProps {
  onSubmit?: (data: ResetFormValues) => void
  isLoading?: boolean
  className?: string
}

export function ResetPasswordForm({
  onSubmit,
  isLoading = false,
  className,
}: ResetPasswordFormProps) {
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      verifyPassword: "",
    },
  })

  const handleSubmit = (data: ResetFormValues) => {
    if (onSubmit) {
      onSubmit(data)
    } else {
      console.log("Reset password data:", data)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Provide your current password and choose a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FieldGroup>
              <Controller
                name="currentPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Current password</FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter current password"
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="newPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>New password</FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter new password"
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="verifyPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Verify new password</FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Re-enter new password"
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Remembered your password?{" "}
              </span>
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
