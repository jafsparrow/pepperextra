import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { supplierFormSchema } from "../../schema/supplier-schema"
import type { SupplierFormValues } from "../../schema/supplier-schema"

interface SupplierFormProps {
  onSubmit?: (data: SupplierFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<SupplierFormValues>
  submitLabel?: string
}

export function SupplierForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save supplier",
}: SupplierFormProps) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      contactName: defaultValues?.contactName ?? "",
      contactPhone: defaultValues?.contactPhone ?? "",
      contactEmail: defaultValues?.contactEmail ?? "",
      paymentTermsDays: defaultValues?.paymentTermsDays ?? undefined,
    },
  })

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      contactName: defaultValues?.contactName ?? "",
      contactPhone: defaultValues?.contactPhone ?? "",
      contactEmail: defaultValues?.contactEmail ?? "",
      paymentTermsDays: defaultValues?.paymentTermsDays ?? undefined,
    })
  }, [defaultValues, form])

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit?.(data))}
      className={cn("space-y-6", className)}
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Supplier name</FieldLabel>
            <Input {...field} type="text" placeholder="Oman Cement Company" />
            <FieldDescription>The vendor's registered business name.</FieldDescription>
          </Field>
        )}
      />

      <FieldGroup>
        <Controller
          name="contactName"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Contact person</FieldLabel>
              <Input {...field} type="text" placeholder="Salim Al Harthy" />
            </Field>
          )}
        />

        <Controller
          name="contactPhone"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Contact phone</FieldLabel>
              <Input {...field} type="tel" placeholder="+968 9244 1122" />
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="contactEmail"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Contact email</FieldLabel>
            <Input {...field} type="email" placeholder="sales@example.om" />
          </Field>
        )}
      />

      <Controller
        name="paymentTermsDays"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Payment terms (days)</FieldLabel>
            <Input
              {...field}
              type="number"
              min={0}
              placeholder="30"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
              }
            />
            <FieldDescription>Net payment window in days.</FieldDescription>
          </Field>
        )}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || form.formState.isSubmitting || !form.formState.isValid}
      >
        {isLoading ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}
