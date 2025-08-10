export function formatCurrency(amount: number): string {
  return `KES ${Number.parseFloat(amount.toString()).toFixed(2)}`
}
