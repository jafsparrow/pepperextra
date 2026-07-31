import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
import { orpc } from "@/shared/utils/orpc"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"
import { Pencil, Save, X, Globe, Phone, MapPin, Hash, Tag, MessageCircle, Mail, Link as LinkIcon, Clock } from "lucide-react"

interface FieldConfig {
  label: string
  placeholder: string
  icon: typeof Globe
  type?: string
}

const contactFields: (FieldConfig & { id: string })[] = [
  { id: "phone", label: "Phone", placeholder: "+968 1234 5678", icon: Phone, type: "tel" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "+968 1234 5678", icon: MessageCircle, type: "tel" },
  { id: "email", label: "Email", placeholder: "contact@brand.com", icon: Mail, type: "email" },
  { id: "website", label: "Website", placeholder: "https://example.com", icon: LinkIcon, type: "url" },
]

const metadataFields: (FieldConfig & { id: string })[] = [
  { id: "country", label: "Country", placeholder: "e.g. Oman", icon: Globe },
  { id: "tagline", label: "Tagline", placeholder: "Your brand tagline", icon: Tag },
  { id: "taxNumber", label: "Tax Number (VAT/GST)", placeholder: "e.g. VAT-123456", icon: Hash },
  { id: "address", label: "Address", placeholder: "Full business address", icon: MapPin },
  { id: "timezone", label: "Timezone", placeholder: "e.g. Asia/Muscat", icon: Clock },
  { id: "dateFormat", label: "Date Format", placeholder: "e.g. DD/MM/YYYY", icon: Clock },
]

const countries = [
  "Oman", "United Arab Emirates", "Saudi Arabia", "Qatar", "Bahrain", "Kuwait",
  "India", "Pakistan", "Sri Lanka", "Bangladesh", "United States", "United Kingdom",
]

const timezones = [
  "Asia/Muscat", "Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Bahrain", "Asia/Kuwait",
  "Asia/Kolkata", "Asia/Karachi", "Asia/Colombo", "Asia/Dhaka",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "UTC",
]

const dateFormats = [
  "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY",
]

function InlineEditField({
  label,
  value,
  placeholder,
  icon: Icon,
  type = "text",
  onSave,
  options,
}: FieldConfig & {
  value: string | null | undefined
  onSave: (value: string) => Promise<void>
  options?: string[]
}) {
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
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {editing ? (
            options ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                autoFocus
              >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
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
            )
          ) : (
            <p className="truncate text-sm font-medium text-foreground">
              {value || <span className="italic text-muted-foreground/60">Not set</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function OrgNameEditor({
  name,
  onSave,
}: {
  name: string
  onSave: (value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(name)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      await onSave(editValue)
      setEditing(false)
      toast.success("Organization name updated")
    } catch {
      toast.error("Failed to update organization name")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(name)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-3">
      {editing ? (
        <>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-9 max-w-md text-lg font-semibold"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">{name}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

export function OrgSettings() {
  const { data: activeOrg, refetch: refetchActiveOrg } = authClient.useActiveOrganization()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    ...orpc.organizationSettings.get.queryOptions({
      input: { organizationId: activeOrg?.id ?? "" },
    }),
    enabled: !!activeOrg?.id,
  })

  const updateMutation = useMutation(
    orpc.organizationSettings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["org-settings"] })
      },
    })
  )

  const updateNameMutation = useMutation(
    orpc.organizationSettings.updateName.mutationOptions({
      onSuccess: async () => {
        await refetchActiveOrg()
      },
    })
  )

  const handleUpdate = useCallback(
    async (key: string, value: string) => {
      if (!activeOrg?.id) return
      await updateMutation.mutateAsync({
        organizationId: activeOrg.id,
        [key]: value || null,
      })
    },
    [activeOrg?.id, updateMutation]
  )

  const handleUpdateName = useCallback(
    async (name: string) => {
      if (!activeOrg?.id) return
      await updateNameMutation.mutateAsync({
        organizationId: activeOrg.id,
        name,
      })
    },
    [activeOrg?.id, updateNameMutation]
  )

  if (!activeOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">Select a brand first to manage its settings.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    )
  }

  const getOptionsForField = (id: string): string[] | undefined => {
    if (id === "country") return countries
    if (id === "timezone") return timezones
    if (id === "dateFormat") return dateFormats
    return undefined
  }

  const renderSection = (
    title: string,
    description: string,
    fields: (FieldConfig & { id: string })[]
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {fields.map((field) => (
          <InlineEditField
            key={field.id}
            {...field}
            value={settings?.[field.id as keyof typeof settings] as string | null | undefined}
            options={getOptionsForField(field.id)}
            onSave={(val) => handleUpdate(field.id, val)}
          />
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <OrgNameEditor name={activeOrg.name} onSave={handleUpdateName} />
        <p className="text-sm text-muted-foreground">
          Manage your brand's general information and preferences. Currency is set automatically from the country.
        </p>
      </div>

      {renderSection(
        "Contact",
        "How customers can reach you. Click any field to edit, press Enter to save or Escape to cancel.",
        contactFields
      )}

      {renderSection(
        "Metadata",
        "Brand country, location and preferences. Currency is picked automatically from the country.",
        metadataFields
      )}
    </div>
  )
}
