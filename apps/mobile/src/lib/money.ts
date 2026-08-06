export type CurrencyCode =
  | "OMR"
  | "AED"
  | "SAR"
  | "QAR"
  | "BHD"
  | "KWD"

const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  OMR: 3,
  AED: 2,
  SAR: 2,
  QAR: 2,
  BHD: 3,
  KWD: 3,
}

/**
 * Per-tenant currency. Money is always stored as integer minor units
 * (baisa / fils / halala). The active currency comes from org metadata;
 * OMR is the seeded default. Never hardcode a symbol in screens.
 */
export interface Currency {
  code: CurrencyCode
  decimals: number
}

export const DEFAULT_CURRENCY: Currency = { code: "OMR", decimals: CURRENCY_DECIMALS.OMR }

export function formatMinorUnits(minor: number, currency: Currency = DEFAULT_CURRENCY): string {
  const value = minor / 10 ** currency.decimals
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })
}
