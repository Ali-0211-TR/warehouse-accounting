/**
 * Форматирует цену для отображения
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Форматирует баланс с единицами измерения
 */
export function formatBalance(
  balance: number,
  unit?: { short_name: string } | null
): string {
  return `${balance} ${unit?.short_name || ""}`;
}
