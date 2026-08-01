import { useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { orpc } from "@/shared/utils/orpc"
import { toMinorUnits } from "@/shared/utils/currency"
import { CUSTOMER_QUERY_KEYS } from "../../constants"
import { CustomerForm } from "./customer-form"
import type { CustomerFormValues } from "../../schema/customer-schema"
import type { Customer } from "@repo/contracts"

interface CustomerModalProps {
  orgId: string
  children?: ReactNode
  customer?: Customer
}

export function CustomerModal({
  orgId,
  children,
  customer,
}: CustomerModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.lists() })

  const createMutation = useMutation(
    orpc.customer.create.mutationOptions({
      onSuccess: () => {
        toast.success("Customer created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.customer.update.mutationOptions({
      onSuccess: () => {
        toast.success("Customer updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: CustomerFormValues) => {
    const payload = {
      type: data.type,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      creditLimitMinor:
        data.creditLimit && data.creditLimit !== ""
          ? toMinorUnits(data.creditLimit)
          : undefined,
      paymentTermsDays:
        data.paymentTermsDays === undefined ? undefined : data.paymentTermsDays,
      vatNumber: data.vatNumber || undefined,
      billingAddress: data.billingAddress || undefined,
      notes: data.notes || undefined,
    }

    if (customer) {
      updateMutation.mutate({
        organizationId: orgId,
        id: customer.id,
        ...payload,
      })
    } else {
      createMutation.mutate({ organizationId: orgId, ...payload })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">{customer ? "Edit" : "Add customer"}</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? "Edit customer" : "Add customer"}
          </DialogTitle>
          <DialogDescription>
            {customer
              ? "Update this customer's details."
              : "Add a new customer to your records."}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={customer ? "Save changes" : "Create customer"}
          defaultValues={
            customer
              ? {
                  type: customer.type,
                  name: customer.name,
                  phone: customer.phone ?? "",
                  email: customer.email ?? "",
                  creditLimit:
                    customer.creditLimitMinor &&
                    customer.creditLimitMinor !== "0"
                      ? (Number(customer.creditLimitMinor) / 1000).toString()
                      : "",
                  paymentTermsDays: customer.paymentTermsDays ?? undefined,
                  vatNumber: customer.vatNumber ?? "",
                  billingAddress: customer.billingAddress ?? "",
                  notes: customer.notes ?? "",
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
