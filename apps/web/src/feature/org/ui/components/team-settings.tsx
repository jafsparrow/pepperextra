import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@pepperextra/auth/client"
import { orpc } from "@/shared/utils/orpc"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Switch } from "@workspace/ui/components/switch"
import { toast } from "sonner"
import {
  Pencil,
  Save,
  X,
  Printer,
  Percent,
  Receipt,
  Plus,
  Trash2,
} from "lucide-react"

interface TeamSettingsProps {
  teamId: string
  teamName: string
}

interface InlineEditProps {
  label: string
  value: string | null | undefined
  placeholder: string
  type?: string
  onSave: (value: string) => Promise<void>
}

function InlineEdit({ label, value, placeholder, type = "text", onSave }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editValue)
      setEditing(false)
      toast.success(`${label} updated`)
    } catch {
      toast.error(`Failed to update ${label}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value ?? "")
    setEditing(false)
  }

  return (
    <div className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/40 hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {editing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="mt-0.5 h-7 text-sm"
            placeholder={placeholder}
            type={type}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
          />
        ) : (
          <p className="truncate text-sm font-medium text-foreground">
            {value || <span className="italic text-muted-foreground/60">Not set</span>}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 pl-2">
        {editing ? (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleCancel}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function PrintSettings({ teamId, orgId: _orgId }: { teamId: string; orgId: string }) {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    ...orpc.teamSettings.get.queryOptions({ input: { teamId } }),
    enabled: !!teamId,
  })

  const updateMutation = useMutation(
    orpc.teamSettings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-settings"] })
      },
    })
  )

  const handleUpdate = useCallback(
    async (key: string, value: string | boolean) => {
      if (!teamId) return
      await updateMutation.mutateAsync({
        teamId,
        [key]: value,
      } as any)
    },
    [teamId, updateMutation]
  )

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-3">
          <Printer className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Print Enabled</p>
            <p className="text-xs text-muted-foreground">Allow printing from this location</p>
          </div>
        </div>
        <Switch
          checked={settings?.printEnabled ?? true}
          onCheckedChange={(checked) => handleUpdate("printEnabled", checked)}
        />
      </div>

      <InlineEdit
        label="Paper Width"
        value={settings?.paperWidth}
        placeholder="e.g. 80mm, 58mm"
        onSave={(val) => handleUpdate("paperWidth", val)}
      />

      <InlineEdit
        label="Default Printer IP"
        value={settings?.defaultPrinterIp}
        placeholder="e.g. 192.168.1.100"
        onSave={(val) => handleUpdate("defaultPrinterIp", val)}
      />

      <InlineEdit
        label="Receipt Footer"
        value={settings?.receiptFooter}
        placeholder="Thank you for visiting!"
        onSave={(val) => handleUpdate("receiptFooter", val)}
      />
    </div>
  )
}

function TaxSettings({ teamId, orgId }: { teamId: string; orgId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", rate: "", type: "percentage" as "percentage" | "fixed", isDefault: false })

  const { data: taxes, isLoading } = useQuery({
    ...orpc.taxConfig.list.queryOptions({ input: { teamId } }),
    enabled: !!teamId,
  })

  const createMutation = useMutation(
    orpc.taxConfig.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-taxes"] })
        setShowForm(false)
        setFormData({ name: "", rate: "", type: "percentage", isDefault: false })
        toast.success("Tax added")
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const updateMutation = useMutation(
    orpc.taxConfig.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-taxes"] })
        setEditingId(null)
        toast.success("Tax updated")
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const deleteMutation = useMutation(
    orpc.taxConfig.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-taxes"] })
        toast.success("Tax deleted")
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const handleCreate = () => {
    createMutation.mutate({
      teamId,
      organizationId: orgId,
      ...formData,
      rate: formData.rate,
    })
  }

  const handleStartEdit = (tax: NonNullable<typeof taxes>[number]) => {
    setEditingId(tax.id)
    setFormData({ name: tax.name, rate: tax.rate, type: tax.type, isDefault: tax.isDefault ?? false })
  }

  const handleUpdateTax = () => {
    if (!editingId) return
    updateMutation.mutate({
      teamId,
      id: editingId,
      name: formData.name,
      rate: formData.rate,
      type: formData.type,
      isDefault: formData.isDefault,
    })
  }

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {taxes?.length ?? 0} tax rate{(taxes?.length ?? 0) !== 1 ? "s" : ""} configured
        </p>
        <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: "", rate: "", type: "percentage", isDefault: false }) }}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Tax
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Name</p>
                <Input
                  placeholder="e.g. VAT, Service Tax"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="w-24">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Rate</p>
                <Input
                  placeholder="5"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </div>
              <div className="w-32">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Type</p>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "percentage" | "fixed" })}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <Button size="sm" onClick={editingId ? handleUpdateTax : handleCreate} disabled={!formData.name || !formData.rate}>
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!taxes || taxes.length === 0) && !showForm ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Percent className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tax rates configured yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {taxes?.map((tax) => (
            <div key={tax.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{tax.name}</p>
                    {tax.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Default</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tax.rate}{tax.type === "percentage" ? "%" : " OMR"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(tax)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate({ teamId, id: tax.id })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceChargeSettings({ teamId, orgId }: { teamId: string; orgId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", amount: "", type: "fixed" as "percentage" | "fixed", isDefault: false })

  const { data: charges, isLoading } = useQuery({
    ...orpc.serviceCharge.list.queryOptions({ input: { teamId } }),
    enabled: !!teamId,
  })

  const createMutation = useMutation(
    orpc.serviceCharge.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-charges"] })
        setShowForm(false)
        setFormData({ name: "", amount: "", type: "fixed", isDefault: false })
        toast.success("Service charge added")
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const updateMutation = useMutation(
    orpc.serviceCharge.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-charges"] })
        setEditingId(null)
        toast.success("Service charge updated")
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const deleteMutation = useMutation(
    orpc.serviceCharge.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["team-charges"] })
        toast.success("Service charge deleted")
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const handleCreate = () => {
    createMutation.mutate({
      teamId,
      organizationId: orgId,
      ...formData,
      amount: formData.amount,
    })
  }

  const handleStartEdit = (charge: NonNullable<typeof charges>[number]) => {
    setEditingId(charge.id)
    setFormData({ name: charge.name, amount: charge.amount, type: charge.type, isDefault: charge.isDefault ?? false })
  }

  const handleUpdateCharge = () => {
    if (!editingId) return
    updateMutation.mutate({
      teamId,
      id: editingId,
      name: formData.name,
      amount: formData.amount,
      type: formData.type,
      isDefault: formData.isDefault,
    })
  }

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {charges?.length ?? 0} charge{(charges?.length ?? 0) !== 1 ? "s" : ""} configured
        </p>
        <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: "", amount: "", type: "fixed", isDefault: false }) }}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Charge
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Name</p>
                <Input
                  placeholder="e.g. Delivery Charge"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="w-24">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Amount</p>
                <Input
                  placeholder="1.500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="w-32">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Type</p>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "percentage" | "fixed" })}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <Button size="sm" onClick={editingId ? handleUpdateCharge : handleCreate} disabled={!formData.name || !formData.amount}>
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!charges || charges.length === 0) && !showForm ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Receipt className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No service charges configured yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {charges?.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{charge.name}</p>
                    {charge.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Default</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {charge.amount}{charge.type === "percentage" ? "%" : " OMR"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(charge)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate({ teamId, id: charge.id })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TeamSettings({ teamId, teamName }: TeamSettingsProps) {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const orgId = activeOrg?.id ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Location Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure settings for <strong>{teamName}</strong>.
        </p>
      </div>

      <Tabs defaultValue="print">
        <TabsList>
          <TabsTrigger value="print">
            <Printer className="mr-1.5 h-4 w-4" />
            Print Settings
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Percent className="mr-1.5 h-4 w-4" />
            Tax Settings
          </TabsTrigger>
          <TabsTrigger value="charges">
            <Receipt className="mr-1.5 h-4 w-4" />
            Service Charges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="print" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Print Configuration</CardTitle>
              <CardDescription>
                Configure thermal printer settings for this location.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrintSettings teamId={teamId} orgId={orgId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>
                Manage tax rates (VAT, service tax, etc.) for this location.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaxSettings teamId={teamId} orgId={orgId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Charges</CardTitle>
              <CardDescription>
                Configure delivery charges, packing fees, and other service charges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceChargeSettings teamId={teamId} orgId={orgId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
