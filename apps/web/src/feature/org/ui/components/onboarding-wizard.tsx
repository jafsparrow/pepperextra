import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@repo/auth/client"
import { orpc } from "@/shared/utils/orpc"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Globe,
  Phone,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Hash,
  Mail,
  Link as LinkIcon,
  Clock,
} from "lucide-react"

const timezones = [
  "Asia/Muscat",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Kuwait",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Colombo",
  "Asia/Dhaka",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "UTC",
]

const dateFormats = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY",
]

const steps = [
  {
    id: "country",
    title: "Country & Currency",
    description: "Your business location determines the currency used across your products.",
    icon: Globe,
  },
  {
    id: "contact",
    title: "Contact details",
    description: "How customers can reach you.",
    icon: Phone,
  },
  {
    id: "business",
    title: "Business details",
    description: "Tax number, address and regional preferences.",
    icon: Building2,
  },
  {
    id: "review",
    title: "Review & finish",
    description: "Confirm your details to finish setting up your organization.",
    icon: Check,
  },
]

export function OnboardingWizard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: activeOrg, isPending: isActiveOrgPending } =
    authClient.useActiveOrganization()

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    ...orpc.organizationSettings.get.queryOptions({
      input: { organizationId: activeOrg?.id ?? "" },
    }),
    enabled: !!activeOrg?.id,
  })

  const { data: countries = [], isLoading: isCountriesLoading } = useQuery(
    orpc.countries.list.queryOptions()
  )

  const [step, setStep] = useState(0)
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [tagline, setTagline] = useState("")
  const [taxNumber, setTaxNumber] = useState("")
  const [address, setAddress] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const hydrated = useRef(false)

  useEffect(() => {
    if (!settings || hydrated.current) return
    hydrated.current = true
    setCountry(settings.country ?? "")
    setPhone(settings.phone ?? "")
    setWhatsapp(settings.whatsapp ?? "")
    setEmail(settings.email ?? "")
    setWebsite(settings.website ?? "")
    setTagline(settings.tagline ?? "")
    setTaxNumber(settings.taxNumber ?? "")
    setAddress(settings.address ?? "")
    setTimezone(settings.timezone ?? "UTC")
    setDateFormat(settings.dateFormat ?? "DD/MM/YYYY")
  }, [settings])

  useEffect(() => {
    if (settings?.onboardingCompleted) {
      navigate({ to: "/org" })
    }
  }, [settings?.onboardingCompleted, navigate])

  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === country),
    [countries, country]
  )
  const currency = selectedCountry?.currencyCode ?? null

  const updateMutation = useMutation(
    orpc.organizationSettings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["org-settings"] })
      },
    })
  )

  const handleComplete = async () => {
    if (!activeOrg?.id) return
    await updateMutation.mutateAsync({
      organizationId: activeOrg.id,
      country: country || null,
      currency,
      tagline: tagline || null,
      taxNumber: taxNumber || null,
      address: address || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      website: website || null,
      timezone: timezone || null,
      dateFormat: dateFormat || null,
      onboardingCompleted: true,
    })
    navigate({ to: "/org" })
  }

  if (isActiveOrgPending || isSettingsLoading || isCountriesLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!activeOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground">
          Select an organization first to complete onboarding.
        </p>
      </div>
    )
  }

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1
  const canProceed = step === 0 ? !!country : true

  const handleNext = () => {
    if (!canProceed) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to {activeOrg.name} 👋
        </h1>
        <p className="text-muted-foreground">
          Let&apos;s get your organization set up in a few steps.
        </p>
      </div>

      <ol className="flex items-center gap-2">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={`flex h-2 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </ol>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <currentStep.icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={currency ? `${selectedCountry?.currencyCode} (${selectedCountry?.currencySymbol})` : "Auto from country"}
                  disabled
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+968 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+968 1234 5678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="Your brand tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Tax Number (VAT/GST)</Label>
                <Input
                  id="taxNumber"
                  placeholder="e.g. VAT-123456"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Full business address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger id="dateFormat" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((df) => (
                      <SelectItem key={df} value={df}>
                        {df}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <dl className="divide-y divide-border rounded-lg border">
              <ReviewRow label="Country" value={country} icon={Globe} />
              <ReviewRow label="Currency" value={currency ?? "Auto from country"} icon={MapPin} />
              <ReviewRow label="Phone" value={phone} icon={Phone} />
              <ReviewRow label="WhatsApp" value={whatsapp} icon={Phone} />
              <ReviewRow label="Email" value={email} icon={Mail} />
              <ReviewRow label="Website" value={website} icon={LinkIcon} />
              <ReviewRow label="Tagline" value={tagline} icon={Tag} />
              <ReviewRow label="Tax Number" value={taxNumber} icon={Hash} />
              <ReviewRow label="Address" value={address} icon={MapPin} />
              <ReviewRow label="Timezone" value={timezone} icon={Clock} />
              <ReviewRow label="Date Format" value={dateFormat} icon={Clock} />
            </dl>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          {isLastStep ? (
            <Button onClick={handleComplete} disabled={!country || updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Spinner className="mr-1 h-4 w-4" />
              ) : (
                <Check className="mr-1 h-4 w-4" />
              )}
              Finish setup
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed}>
              Continue
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Globe
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value || <span className="italic text-muted-foreground/60">Not set</span>}
      </span>
    </div>
  )
}
