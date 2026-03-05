import type { ProductEntity } from "../../model/types";
import { TFunction } from "i18next";
import { getIncomePrice, getOutcomePrice, getSalePrice } from "../price-helpers";
import {
  createEmptyWorkbook,
  createSheetFromAOA,
  addSheetToWorkbook,
  workbookToBlob,
} from "@/shared/lib/export/excel";

/**
 * Форматирует цену для отображения
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Экспорт отчёта товаров в Excel (.xlsx)
 */
export function exportProductsToExcel(
  products: ProductEntity[],
  t: TFunction
): Blob {
  const wb = createEmptyWorkbook();

  // ──── Лист: Товары ────
  const headers = [
    t("product.name"),
    t("product.short_name"),
    t("product.article"),
    t("product.bar_code"),
    t("product.product_type"),
    t("product.balance"),
    t("product.sale"),
    t("product.income"),
    t("product.outcome"),
    t("product.unit"),
    t("product.group"),
  ];

  const rows: (string | number)[][] = [headers];
  for (const product of products) {
    rows.push([
      product.name,
      product.short_name || "—",
      product.article || "—",
      product.bar_code || "—",
      t(`lists.product_type.${product.product_type}`),
      `${product.balance} ${product.unit?.short_name || ""}`,
      formatPrice(getSalePrice(product)),
      formatPrice(getIncomePrice(product)),
      formatPrice(getOutcomePrice(product)),
      product.unit?.short_name || "—",
      product.group?.name || "—",
    ]);
  }

  // Итоговая строка
  rows.push([]);
  rows.push([
    t("common.total"),
    `${products.length} ${t("product.items", "товаров")}`,
    "", "", "", "", "", "", "", "", "",
  ]);

  // Дата генерации
  rows.push([]);
  rows.push([
    t("common.generated_at", "Сформировано"),
    new Date().toLocaleString("ru-RU"),
    "", "", "", "", "", "", "", "", "",
  ]);

  const ws = createSheetFromAOA(rows, [24, 16, 12, 16, 16, 14, 14, 14, 14, 10, 18]);
  addSheetToWorkbook(wb, ws, t("menu.dictionary.products"));

  return workbookToBlob(wb);
}
