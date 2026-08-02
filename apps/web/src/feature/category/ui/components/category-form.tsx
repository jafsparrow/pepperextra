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
import type { FlattenedCategory } from "../../utils/tree"

interface CategoryFormProps {
  onSubmit?: (data: CategoryFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<CategoryFormValues>
  submitLabel?: string
  parentOptions?: FlattenedCategory[]
}

export function CategoryForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save category",
  parentOptions = [],
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      parentId: defaultValues?.parentId ?? null,
      sortOrder: defaultValues?.sortOrder ?? 0,
    },
  })

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      parentId: defaultValues?.parentId ?? null,
      sortOrder: defaultValues?.sortOrder ?? 0,
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
              <FieldLabel>Category name</FieldLabel>
              <Input {...field} type="text" placeholder="Plumbing" />
              <FieldDescription>
                A broad classification used to group products for browsing.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="sortOrder"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Sort order</FieldLabel>
              <Input
                {...field}
                type="number"
                min={0}
                placeholder="0"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
              <FieldDescription>
                Lower values appear first among siblings.
              </FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="parentId"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Parent category</FieldLabel>
            <Select
              value={field.value ?? "none"}
              onValueChange={(v) => field.onChange(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (top level)</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {"— ".repeat(option.depth)}
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Leave empty to make this a top-level category.
            </FieldDescription>
          </Field>
        )}
      />

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
