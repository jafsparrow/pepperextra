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
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { productFormSchema } from "../../schema/product-schema"
import type { ProductFormValues } from "../../schema/product-schema"
import type { ProductGroup, Category } from "@repo/contracts"
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/feature/category/utils/tree"

interface ProductFormProps {
  onSubmit?: (data: ProductFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<ProductFormValues>
  submitLabel?: string
  productGroups?: ProductGroup[]
  categories?: Category[]
}

export function ProductForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save product",
  productGroups = [],
  categories = [],
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      skuCode: defaultValues?.skuCode ?? "",
      productGroupId: defaultValues?.productGroupId ?? undefined,
      categoryId: defaultValues?.categoryId ?? undefined,
      specCode: defaultValues?.specCode ?? "",
      brandTag: defaultValues?.brandTag ?? "",
      basePrice: defaultValues?.basePrice ?? "",
      unit: defaultValues?.unit ?? "",
      aliases: defaultValues?.aliases ?? "",
      eligibleForLoyalty: defaultValues?.eligibleForLoyalty ?? false,
      reorderThreshold: defaultValues?.reorderThreshold ?? undefined,
    },
  })

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      skuCode: defaultValues?.skuCode ?? "",
      productGroupId: defaultValues?.productGroupId ?? undefined,
      categoryId: defaultValues?.categoryId ?? undefined,
      specCode: defaultValues?.specCode ?? "",
      brandTag: defaultValues?.brandTag ?? "",
      basePrice: defaultValues?.basePrice ?? "",
      unit: defaultValues?.unit ?? "",
      aliases: defaultValues?.aliases ?? "",
      eligibleForLoyalty: defaultValues?.eligibleForLoyalty ?? false,
      reorderThreshold: defaultValues?.reorderThreshold ?? undefined,
    })
  }, [defaultValues, form])

  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories))

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
              <FieldLabel>Product name</FieldLabel>
              <Input
                {...field}
                type="text"
                placeholder="Ordinary Portland Cement 50kg"
              />
              <FieldDescription>
                Display name shown on receipts and quotes.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="skuCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>SKU</FieldLabel>
              <Input {...field} type="text" placeholder="CEM-OPC-50" />
              <FieldDescription>
                Unique stock keeping unit code.
              </FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="productGroupId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Product group</FieldLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={(v) =>
                  field.onChange(v === "none" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No product group</SelectItem>
                  {productGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.specName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Groups equivalent products across brands for alternatives.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={(v) =>
                  field.onChange(v === "none" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {"— ".repeat(option.depth)}
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Classification used for browsing the catalog.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="brandTag"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Brand tag</FieldLabel>
              <Input {...field} type="text" placeholder="Royal Omani" />
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="basePrice"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Base price (major units)</FieldLabel>
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                placeholder="3.250"
              />
              <FieldDescription>
                Entered in major units; converted to minor units for storage.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="unit"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Unit</FieldLabel>
              <Input {...field} type="text" placeholder="bag, bar, can" />
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="specCode"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Spec code</FieldLabel>
            <Input {...field} type="text" placeholder="OPC 42.5N" />
            <FieldDescription>
              Specification code for technical grade matching.
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="aliases"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Aliases</FieldLabel>
            <Input {...field} type="text" placeholder="cement, اسمنت" />
            <FieldDescription>
              Comma-separated alternate names used in search.
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="reorderThreshold"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Reorder threshold</FieldLabel>
            <Input
              {...field}
              type="number"
              min={0}
              placeholder="100"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
            />
            <FieldDescription>
              Stock level that triggers a reorder alert.
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="eligibleForLoyalty"
        control={form.control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            Eligible for tradesperson loyalty points
          </label>
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
