/**
 * Shared number formatter for reports.
 * Formats as "uz-UZ" decimal with no fraction digits.
 */
export function useFormatAmount() {
  const formatter = new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (amount: number) => formatter.format(amount);
}

/**
 * Non-hook version for use outside React components.
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
