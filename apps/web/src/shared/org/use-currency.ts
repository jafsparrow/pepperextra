import { useAdminContext } from "@/shared/org/admin-context"
import {
  DEFAULT_DECIMAL_PLACES,
  formatMajorInput as formatMajorInputUtil,
  formatMoney,
  fromMinorUnits as fromMinorUnitsUtil,
  toMinorUnits as toMinorUnitsUtil,
} from "@/shared/utils/currency"
import type { DecimalSource } from "@/shared/utils/currency"

export function useCurrency() {
  const { currency } = useAdminContext()
  const currencyCode = currency?.code
  const currencySymbol = currency?.symbol
  const decimalPlaces = currency?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES

  const format = (minor: DecimalSource) =>
    formatMoney(minor, { decimalPlaces, currencySymbol })

  const formatValue = (minor: DecimalSource) =>
    formatMoney(minor, { decimalPlaces })

  const formatWithCode = (minor: DecimalSource) => {
    const value = formatValue(minor)
    return currencyCode ? `${value} ${currencyCode}` : value
  }

  return {
    currencyCode,
    currencySymbol,
    decimalPlaces,
    format,
    formatValue,
    formatWithCode,
    toMinorUnits: (major: DecimalSource) => toMinorUnitsUtil(major, decimalPlaces),
    fromMinorUnits: (minor: DecimalSource) => fromMinorUnitsUtil(minor, decimalPlaces),
    formatMajorInput: (value: DecimalSource) =>
      formatMajorInputUtil(value, decimalPlaces),
  }
}
