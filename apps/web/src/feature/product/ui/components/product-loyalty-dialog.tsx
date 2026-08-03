import { useState } from "react"
import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
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
import { toast } from "sonner"
import { z } from "zod"
import { orpc } from "@/shared/utils/orpc"
import type { Product } from "@repo/contracts"

const loyaltyFormSchema = z
  .object({
    eligibleForLoyalty: z.boolean(),
    mode: z.enum(["none", "fixed", "price_percent"]).optional(),
    value: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.eligibleForLoyalty) return
    if (!data.mode || data.mode === "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mode"],
        message: "Select how points are calculated",
      })
    }
    if (data.mode && data.mode !== "none" && data.value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Enter the points value",
      })
    }
  })

type LoyaltyFormValues = z.infer<typeof loyaltyFormSchema>

interface ProductLoyaltyDialogProps {
  orgId: string
  product: Product
  children?: ReactNode
}

export function ProductLoyaltyDialog({
  orgId,
  product,
  children,
}: ProductLoyaltyDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<LoyaltyFormValues>({
    resolver: zodResolver(loyaltyFormSchema),
    defaultValues: {
      eligibleForLoyalty: product.eligibleForLoyalty,
      mode: product.loyaltyPoints.mode,
      value: product.loyaltyPoints.value ?? undefined,
    },
  })

  const eligible = form.watch("eligibleForLoyalty")
  const mode = form.watch("mode")

  const updateMutation = useMutation(
    orpc.product.update.mutationOptions({
      onSuccess: () => {
        toast.success("Loyalty settings updated")
        queryClient.invalidateQueries({ queryKey: ["product"] })
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: LoyaltyFormValues) => {
    const isEligible = data.eligibleForLoyalty
    updateMutation.mutate({
      organizationId: orgId,
      id: product.id,
      eligibleForLoyalty: isEligible,
      loyaltyPoints: {
        mode: isEligible ? (data.mode ?? "none") : "none",
        value: isEligible ? (data.value ?? null) : null,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            Manage loyalty
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Loyalty settings</DialogTitle>
          <DialogDescription>
            Configure how {product.name} awards tradesperson loyalty points.
            Only products made eligible will earn points on sales.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <FieldGroup>
            <Controller
              name="eligibleForLoyalty"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Eligible for tradesperson loyalty points
                </label>
              )}
            />
          </FieldGroup>

          {eligible && (
            <Controller
              name="mode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Points calculation</FieldLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a calculation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed points per unit</SelectItem>
                      <SelectItem value="price_percent">
                        Percent of selling price
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                  <FieldDescription>
                    Fixed gives a set number of points; percent calculates
                    points from the selling price.
                  </FieldDescription>
                </Field>
              )}
            />
          )}

          {eligible && mode && mode !== "none" && (
            <Controller
              name="value"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    {mode === "price_percent"
                      ? "Points per % of price"
                      : "Points per unit"}
                  </FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    placeholder={
                      mode === "price_percent" ? "2" : "10"
                    }
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                  <FieldDescription>
                    {mode === "price_percent"
                      ? "E.g. 2 = 2 points for every 1% earned on price."
                      : "E.g. 10 = 10 points per unit sold."}
                  </FieldDescription>
                </Field>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              updateMutation.isPending ||
              form.formState.isSubmitting ||
              !form.formState.isValid
            }
          >
            {updateMutation.isPending ? "Saving..." : "Save loyalty settings"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
