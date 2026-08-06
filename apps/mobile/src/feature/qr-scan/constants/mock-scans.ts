import type { QrScanEntry } from "@/feature/qr-scan/types"

// TEMP: sample data until the scan log contract + API module exist.
export const MOCK_QR_SCANS: QrScanEntry[] = [
  { id: "s-1", customerId: "c-3", customerName: "Ahmed Al Balushi", tradeType: "plumber", pointsAwarded: 10, result: "valid", scannedAt: "2026-08-06T07:40:00Z" },
  { id: "s-2", customerId: "c-7", customerName: "Said Al Hinai", tradeType: "electrician", pointsAwarded: 10, result: "valid", scannedAt: "2026-08-06T06:15:00Z" },
  { id: "s-3", customerId: "c-6", customerName: "John Doe", result: "valid", scannedAt: "2026-08-05T13:20:00Z" },
  { id: "s-4", customerId: "c-8", customerName: "Mariam Al Zadjali", tradeType: "painter", pointsAwarded: 10, result: "valid", scannedAt: "2026-08-05T10:05:00Z" },
  { id: "s-5", customerId: "c-3", customerName: "Ahmed Al Balushi", result: "redeemed", scannedAt: "2026-08-04T17:45:00Z" },
  { id: "s-6", customerName: "Unknown code", result: "invalid", scannedAt: "2026-08-04T16:30:00Z" },
]

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}
