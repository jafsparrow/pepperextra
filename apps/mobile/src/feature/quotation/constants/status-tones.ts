import type { StatusTone } from "@/components/ui/status-chip"
import type { QuotationStatus } from "@/feature/quotation/types"

export const QUOTATION_STATUS_TONES: Record<QuotationStatus, StatusTone> = {
  draft: "neutral",
  confirmed: "primary",
  converted_to_invoice: "success",
  expired: "danger",
}
