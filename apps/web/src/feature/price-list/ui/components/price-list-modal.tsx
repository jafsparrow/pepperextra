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
import { PRICE_LIST_QUERY_KEYS } from "../../constants"
import { PriceListForm } from "./price-list-form"
import type { PriceListFormValues } from "../../schema/price-list-schema"
import type { PriceList } from "@repo/contracts"

interface PriceListModalProps {
  orgId: string
  children?: ReactNode
  priceList?: PriceList
}

export function PriceListModal({
  orgId,
  children,
  priceList,
}: PriceListModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PRICE_LIST_QUERY_KEYS.lists() })

  const createMutation = useMutation(
    orpc.priceList.create.mutationOptions({
      onSuccess: () => {
        toast.success("Price list created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.priceList.update.mutationOptions({
      onSuccess: () => {
        toast.success("Price list updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: PriceListFormValues) => {
    const payload = {
      name: data.name,
    }

    if (priceList) {
      updateMutation.mutate({
        organizationId: orgId,
        id: priceList.id,
        ...payload,
      })
    } else {
      createMutation.mutate({ organizationId: orgId, ...payload })
    }
  }

  const title = priceList ? "Edit price list" : "Add price list"
  const description = priceList
    ? "Rename this price list."
    : "Create a new price list with per-product prices."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">{title}</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <PriceListForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={priceList ? "Save changes" : "Create price list"}
          defaultValues={priceList ? { name: priceList.name } : undefined}
        />
      </DialogContent>
    </Dialog>
  )
}
