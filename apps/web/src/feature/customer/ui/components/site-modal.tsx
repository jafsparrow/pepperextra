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
import { CUSTOMER_QUERY_KEYS } from "../../constants"
import { SiteForm, siteToFormValues } from "./site-form"
import type { SiteFormValues } from "./site-form"
import type { CustomerSite } from "@repo/contracts"

interface SiteModalProps {
  orgId: string
  customerId: string
  children?: ReactNode
  site?: CustomerSite
}

export function SiteModal({
  orgId,
  customerId,
  children,
  site,
}: SiteModalProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.sites(customerId) })
    queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.detail(customerId) })
  }

  const createMutation = useMutation(
    orpc.customer.createSite.mutationOptions({
      onSuccess: () => {
        toast.success("Site created")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const updateMutation = useMutation(
    orpc.customer.updateSite.mutationOptions({
      onSuccess: () => {
        toast.success("Site updated")
        invalidate()
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const handleSubmit = (data: SiteFormValues) => {
    const managers = data.managers
      .filter((m) => m.name.trim() !== "")
      .map((m) => ({
        name: m.name,
        phone: m.phone || undefined,
        email: m.email || undefined,
      }))

    const payload = {
      name: data.name,
      address: data.address || undefined,
      contactNumber: data.contactNumber || undefined,
      startDate: data.startDate || undefined,
      expectedEndDate: data.expectedEndDate || undefined,
      status: data.status,
      managers,
    }

    if (site) {
      updateMutation.mutate({
        organizationId: orgId,
        customerId,
        siteId: site.id,
        ...payload,
      })
    } else {
      createMutation.mutate({
        organizationId: orgId,
        customerId,
        ...payload,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">{site ? "Edit site" : "Add site"}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{site ? "Edit site" : "Add site"}</DialogTitle>
          <DialogDescription>
            {site
              ? "Update this site and its managers."
              : "Add a new project site with site manager names."}
          </DialogDescription>
        </DialogHeader>
        <SiteForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          submitLabel={site ? "Save changes" : "Create site"}
          defaultValues={site ? siteToFormValues(site) : undefined}
        />
      </DialogContent>
    </Dialog>
  )
}
