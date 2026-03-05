import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import type { PriceType } from "@/shared/bindings/PriceType";
import type { ProductEntity } from "@/shared/bindings/ProductEntity";

/**
 * Get the current active sale price for a product
 * Uses pre-computed field from backend
 */
export function getSalePrice(product: ProductEntity): number {
  return product.sale_price ?? 0;
}

/**
 * Get the current active income price for a product
 * Uses pre-computed field from backend
 */
export function getIncomePrice(product: ProductEntity): number {
  return product.income_price ?? 0;
}

/**
 * Get the current active outcome price for a product
 * Uses pre-computed field from backend
 */
export function getOutcomePrice(product: ProductEntity): number {
  return product.outcome_price ?? 0;
}

/**
 * Get all active prices for a product (one per type)
 * Uses pre-computed fields from backend
 */
export function getActivePrices(product: ProductEntity): {
  sale: number;
  income: number;
  outcome: number;
} {
  return {
    sale: product.sale_price ?? 0,
    income: product.income_price ?? 0,
    outcome: product.outcome_price ?? 0,
  };
}

/**
 * Get the next scheduled price for a specific type
 * (start_time > now, sorted by earliest)
 */
export function getNextScheduledPrice(
  prices: PriceEntity[],
  priceType: PriceType
): PriceEntity | null {
  const now = new Date();

  const nextPrice = prices
    .filter(p => p.price_type === priceType)
    .filter(p => new Date(p.start_time) > now)
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0];

  return nextPrice ?? null;
}
