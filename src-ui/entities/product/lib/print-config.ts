import type { PrintConfig } from "@/shared/lib/print";
import type { ProductEntity } from "../model/types";
import { getIncomePrice, getOutcomePrice, getSalePrice } from "./price-helpers";
import { formatBalance, formatPrice } from "./export-helpers";

/**
 * Создаёт конфигурацию печати для отчёта товаров
 */
export function createProductPrintConfig(
  t: (key: string) => string
): PrintConfig<ProductEntity> {
  return {
    title: t("menu.dictionary.products"),
    pageSize: "A4",
    orientation: "landscape",
    columns: [
      {
        key: "name",
        header: t("product.name"),
        width: "15%",
        formatter: (_value, product) => product.name,
      },
      {
        key: "short_name",
        header: t("product.short_name"),
        width: "12%",
        formatter: (_value, product) => product.short_name || "—",
      },
      {
        key: "article",
        header: t("product.article"),
        width: "8%",
        formatter: (_value, product) => product.article || "—",
        align: "center",
      },
      {
        key: "bar_code",
        header: t("product.bar_code"),
        width: "10%",
        formatter: (_value, product) => product.bar_code || "—",
        align: "center",
      },
      {
        key: "product_type",
        header: t("product.product_type"),
        width: "8%",
        formatter: (_value, product) => t(`lists.product_type.${product.product_type}`),
        align: "center",
      },
      {
        key: "balance",
        header: t("product.balance"),
        width: "8%",
        formatter: (_value, product) => formatBalance(product.balance, product.unit),
        align: "right",
      },
      {
        key: "sale_price",
        header: t("product.sale"),
        width: "10%",
        formatter: (_value, product) => formatPrice(getSalePrice(product)),
        align: "right",
      },
      {
        key: "income_price",
        header: t("product.income"),
        width: "10%",
        formatter: (_value, product) => formatPrice(getIncomePrice(product)),
        align: "right",
      },
      {
        key: "outcome_price",
        header: t("product.outcome"),
        width: "10%",
        formatter: (_value, product) => formatPrice(getOutcomePrice(product)),
        align: "right",
      },
      {
        key: "unit",
        header: t("product.unit"),
        width: "5%",
        formatter: (_value, product) => product.unit?.short_name || "—",
        align: "center",
      },
    ],
  };
}
