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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { categoryFormSchema } from "../../schema/category-schema"
import type { CategoryFormValues } from "../../schema/category-schema"

interface CategoryFormProps {
  onSubmit?: (data: CategoryFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<CategoryFormValues>
  submitLabel?: string
}

export function CategoryForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save category",
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      specName: defaultValues?.specName ?? "",
      brandPriority: defaultValues?.brandPriority ?? "",
      stockTrackingMode: defaultValues?.stockTrackingMode ?? "sku",
      groupReorderThreshold: defaultValues?.groupReorderThreshold ?? undefined,
    },
  })

  useEffect(() => {
    form.reset({
      specName: defaultValues?.specName ?? "",
      brandPriority: defaultValues?.brandPriority ?? "",
      stockTrackingMode: defaultValues?.stockTrackingMode ?? "sku",
      groupReorderThreshold: defaultValues?.groupReorderThreshold ?? undefined,
    })
  }, [defaultValues, form])

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit?.(data))}
      className={cn("space-y-6", className)}
    >
      <FieldGroup>
        <Controller
          name="specName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Category name</FieldLabel>
              <Input {...field} type="text" placeholder="Cement & Gypsum" />
              <FieldDescription>
                The spec group name used to organize products.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="stockTrackingMode"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Stock tracking mode</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sku">Per SKU</SelectItem>
                  <SelectItem value="group">Group (category level)</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Per SKU tracks each product variant; Group tracks at the category
                level.
              </FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="brandPriority"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Brand priority</FieldLabel>
            <Input {...field} type="text" placeholder="Royal Omani, Oman Cement" />
            <FieldDescription>
              Comma-separated brands ordered by preference for quote alternatives.
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="groupReorderThreshold"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Group reorder threshold</FieldLabel>
            <Input
              {...field}
              type="number"
              min={0}
              placeholder="50"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
              }
            />
            <FieldDescription>
              Category-level stock alert threshold when tracking by group.
            </FieldDescription>
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
