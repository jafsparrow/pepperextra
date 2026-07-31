import { createFileRoute } from "@tanstack/react-router"
import { OnboardingWizard } from "@/feature/org/ui/components/onboarding-wizard"

export const Route = createFileRoute("/_app/org/onboarding")({
  component: OnboardingWizard,
})
