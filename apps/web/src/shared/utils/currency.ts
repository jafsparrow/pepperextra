import Decimal from "decimal.js"
import type { Decimal as DecimalType } from "decimal.js"

export const DEFAULT_DECIMAL_PLACES = 3

export type DecimalSource = DecimalType.Value

export function toMinorUnits(
  major: DecimalSource,
  decimalPlaces: number = DEFAULT_DECIMAL_PLACES
): string {
  const amount = new Decimal(major)
  return amount
    .times(new Decimal(10).pow(decimalPlaces))
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toFixed()
}

export function fromMinorUnits(
  minor: DecimalSource,
  decimalPlaces: number = DEFAULT_DECIMAL_PLACES
): Decimal {
  return new Decimal(minor).div(new Decimal(10).pow(decimalPlaces))
}

export function formatMoney(
  minor: DecimalSource,
  options: {
    decimalPlaces?: number
    currencySymbol?: string
  } = {}
): string {
  const { decimalPlaces = DEFAULT_DECIMAL_PLACES, currencySymbol = "" } = options
  const amount = fromMinorUnits(minor, decimalPlaces).toFixed(decimalPlaces)
  const [intPart, fracPart] = amount.split(".")
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const formatted = fracPart ? `${groupedInt}.${fracPart}` : groupedInt
  return currencySymbol ? `${currencySymbol}${formatted}` : formatted
}

export function formatMajorInput(
  value: DecimalSource,
  decimalPlaces: number = DEFAULT_DECIMAL_PLACES
): string {
  return new Decimal(value)
    .toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN)
    .toFixed()
}
