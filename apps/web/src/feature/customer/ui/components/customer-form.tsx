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
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { CUSTOMER_TYPE_LABELS } from "../../constants"
import { customerFormSchema } from "../../schema/customer-schema"
import type { CustomerFormValues } from "../../schema/customer-schema"

interface CustomerFormProps {
  onSubmit?: (data: CustomerFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<CustomerFormValues>
  submitLabel?: string
}

export function CustomerForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save customer",
}: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      type: defaultValues?.type ?? "retail",
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      creditLimit: defaultValues?.creditLimit ?? "",
      paymentTermsDays: defaultValues?.paymentTermsDays ?? undefined,
      vatNumber: defaultValues?.vatNumber ?? "",
      billingAddress: defaultValues?.billingAddress ?? "",
      notes: defaultValues?.notes ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      type: defaultValues?.type ?? "retail",
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      creditLimit: defaultValues?.creditLimit ?? "",
      paymentTermsDays: defaultValues?.paymentTermsDays ?? undefined,
      vatNumber: defaultValues?.vatNumber ?? "",
      billingAddress: defaultValues?.billingAddress ?? "",
      notes: defaultValues?.notes ?? "",
    })
  }, [defaultValues, form])

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit?.(data))}
      className={cn("space-y-6", className)}
    >
      <FieldGroup>
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Customer type</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Account and contractor types support credit limits.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Customer name</FieldLabel>
              <Input {...field} type="text" placeholder="Al Rawabi Contracting LLC" />
              <FieldDescription>Business or personal name.</FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="phone"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input {...field} type="tel" placeholder="+968 9901 2233" />
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Email</FieldLabel>
              <Input {...field} type="email" placeholder="accounts@example.om" />
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="creditLimit"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Credit limit (major units)</FieldLabel>
              <Input {...field} type="text" inputMode="decimal" placeholder="250.000" />
              <FieldDescription>
                Entered in major units; converted to minor units for storage.
              </FieldDescription>
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
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="vatNumber"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>VAT number</FieldLabel>
            <Input {...field} type="text" placeholder="OM123456789" />
          </Field>
        )}
      />

      <Controller
        name="billingAddress"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Billing address</FieldLabel>
            <Input {...field} type="text" placeholder="PO Box 123, Muscat, Oman" />
          </Field>
        )}
      />

      <Controller
        name="notes"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              {...field}
              rows={3}
              placeholder="Net 30, delivery to site..."
            />
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
