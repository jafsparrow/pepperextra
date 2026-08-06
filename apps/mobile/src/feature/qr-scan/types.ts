export type ScanResult = "valid" | "redeemed" | "invalid"

export interface QrScanEntry {
  id: string
  customerId?: string
  customerName: string
  tradeType?: string
  pointsAwarded?: number
  result: ScanResult
  scannedAt: string
  scannedBy?: string
}
