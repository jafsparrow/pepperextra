import type { StatusTone } from "@/components/ui/status-chip"
import type { InvoiceStatus } from "@/feature/invoice/types"

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, StatusTone> = {
  active: "steel",
  paid: "success",
  partially_credited: "primary",
  fully_credited: "danger",
  void: "neutral",
}
