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
import { SUPPLIER_QUERY_KEYS } from "../../constants"
import { SupplierForm } from "./supplier-form"
import type { SupplierFormValues } from "../../schema/supplier-schema"
import type { Supplier } from "@repo/contracts"

interface SupplierModalProps {
  orgId: string
  children?: ReactNode
  supplier?: Supplier
}

export function SupplierModal({ orgId, children, supplier }: SupplierModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.lists() })

  const createMutation = useMutation(
    orpc.supplier.create.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.supplier.update.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: SupplierFormValues) => {
    const payload = {
      name: data.name,
      contactName: data.contactName || undefined,
      contactPhone: data.contactPhone || undefined,
      contactEmail: data.contactEmail || undefined,
      paymentTermsDays:
        data.paymentTermsDays === undefined ? undefined : data.paymentTermsDays,
    }

    if (supplier) {
      updateMutation.mutate({ organizationId: orgId, id: supplier.id, ...payload })
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
          <Button type="button">{supplier ? "Edit" : "Add supplier"}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
          <DialogDescription>
            {supplier
              ? "Update this supplier's details."
              : "Add a new supplier to your vendor list."}
          </DialogDescription>
        </DialogHeader>
        <SupplierForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={supplier ? "Save changes" : "Create supplier"}
          defaultValues={
            supplier
              ? {
                  name: supplier.name,
                  contactName: supplier.contactName ?? "",
                  contactPhone: supplier.contactPhone ?? "",
                  contactEmail: supplier.contactEmail ?? "",
                  paymentTermsDays: supplier.paymentTermsDays ?? undefined,
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
