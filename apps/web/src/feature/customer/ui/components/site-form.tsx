import { useEffect } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
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
import { SITE_STATUS_LABELS } from "../../constants"
import type { CustomerSite } from "@repo/contracts"

const managerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
})

export const siteFormSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "cancelled"]),
  managers: z.array(managerSchema),
})

export type SiteFormValues = z.infer<typeof siteFormSchema>

interface SiteFormProps {
  onSubmit?: (data: SiteFormValues) => void | Promise<void>
  isLoading?: boolean
  className?: string
  defaultValues?: Partial<SiteFormValues>
  submitLabel?: string
}

const toDateInputValue = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : ""

export function SiteForm({
  onSubmit,
  isLoading = false,
  className,
  defaultValues,
  submitLabel = "Save site",
}: SiteFormProps) {
  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
      contactNumber: defaultValues?.contactNumber ?? "",
      startDate: defaultValues?.startDate
        ? toDateInputValue(defaultValues.startDate)
        : "",
      expectedEndDate: defaultValues?.expectedEndDate
        ? toDateInputValue(defaultValues.expectedEndDate)
        : "",
      status: defaultValues?.status ?? "active",
      managers: defaultValues?.managers?.length
        ? defaultValues.managers
        : [{ name: "", phone: "", email: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "managers",
  })

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
      contactNumber: defaultValues?.contactNumber ?? "",
      startDate: defaultValues?.startDate
        ? toDateInputValue(defaultValues.startDate)
        : "",
      expectedEndDate: defaultValues?.expectedEndDate
        ? toDateInputValue(defaultValues.expectedEndDate)
        : "",
      status: defaultValues?.status ?? "active",
      managers: defaultValues?.managers?.length
        ? defaultValues.managers
        : [{ name: "", phone: "", email: "" }],
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
              <FieldLabel>Site name</FieldLabel>
              <Input {...field} type="text" placeholder="Al Khuwair Tower Site" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SITE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FieldGroup>

      <Controller
        name="address"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Address</FieldLabel>
            <Input {...field} type="text" placeholder="Site address" />
          </Field>
        )}
      />

      <FieldGroup>
        <Controller
          name="contactNumber"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Contact number</FieldLabel>
              <Input {...field} type="tel" placeholder="+968 9900 0000" />
            </Field>
          )}
        />

        <Controller
          name="startDate"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Start date</FieldLabel>
              <Input {...field} type="date" />
            </Field>
          )}
        />

        <Controller
          name="expectedEndDate"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Expected end date</FieldLabel>
              <Input {...field} type="date" />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Site managers</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", phone: "", email: "" })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add manager
          </Button>
        </div>

        {fields.map((siteField, index) => (
          <div
            key={siteField.id}
            className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Manager {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Controller
              name={`managers.${index}.name`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Name</FieldLabel>
                  <Input {...field} type="text" placeholder="Engineer Salim" />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                name={`managers.${index}.phone`}
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Phone</FieldLabel>
                    <Input {...field} type="tel" />
                  </Field>
                )}
              />
              <Controller
                name={`managers.${index}.email`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input {...field} type="email" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        ))}
        <FieldDescription>
          Managers are the point-of-contact people on-site for this project.
        </FieldDescription>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || form.formState.isSubmitting}
      >
        {isLoading ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}

export function siteToFormValues(site: CustomerSite): SiteFormValues {
  return {
    name: site.name,
    address: site.address ?? "",
    contactNumber: site.contactNumber ?? "",
    startDate: site.startDate ? toDateInputValue(site.startDate) : "",
    expectedEndDate: site.expectedEndDate
      ? toDateInputValue(site.expectedEndDate)
      : "",
    status: site.status,
    managers: site.contacts.map((contact) => ({
      name: contact.name,
      phone: contact.phone ?? "",
      email: contact.email ?? "",
    })),
  }
}
