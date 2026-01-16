/**
 * Format a number as currency (KES) with comma separators
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount)
}

/**
 * Format a number with comma separators (no currency symbol)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount)
}

/**
 * Parse currency string back to number
 */
export function parseCurrency(currencyString: string): number {
  return Number.parseFloat(currencyString.replace(/[^0-9.-]+/g, "")) || 0
}
