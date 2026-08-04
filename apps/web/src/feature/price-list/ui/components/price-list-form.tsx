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
import { priceListFormSchema } from "../../schema/price-list-schema"
import type { PriceListFormValues } from "../../schema/price-list-schema"

interface PriceListFormProps {
  onSubmit?: (data: PriceListFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<PriceListFormValues>
  submitLabel?: string
}

export function PriceListForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save price list",
}: PriceListFormProps) {
  const form = useForm<PriceListFormValues>({
    resolver: zodResolver(priceListFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
    })
  }, [defaultValues, form])

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit?.(data))}
      className={cn("space-y-6", className)}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Price list name</FieldLabel>
              <Input {...field} type="text" placeholder="Wholesale" />
              <FieldDescription>
                A named schedule of per-product prices. SKUs without a price
                here fall back to the sale price.
              </FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        className="w-full"
        disabled={
          isLoading || form.formState.isSubmitting || !form.formState.isValid
        }
      >
        {isLoading ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}
