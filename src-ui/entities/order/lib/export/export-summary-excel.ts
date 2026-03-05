import { TFunction } from "i18next";
import type { SummaryReportData } from "../summary-print-config";
import { getIncomePrice, getSalePrice } from "@/entities/product";
import {
  createEmptyWorkbook,
  createSheetFromAOA,
  addSheetToWorkbook,
  workbookToBlob,
} from "@/shared/lib/export/excel";

/**
 * Форматирует сумму для отображения
 */
function fmt(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Экспорт сводного отчёта в Excel (.xlsx) с несколькими листами
 */
export function exportSummaryReportToExcel(
  data: SummaryReportData,
  t: TFunction,
): Blob {
  const wb = createEmptyWorkbook();
  const { totalsByType, meta, ordersCount, products } = data;

  // Расчёт складских показателей
  const [totalSaleProduct, totalIncomeProduct] = products.reduce(
    (sum, product) => [
      sum[0] + getSalePrice(product) * product.balance,
      sum[1] + getIncomePrice(product) * product.balance,
    ],
    [0, 0],
  );

  // Расчёт денежных потоков
  const totalIncoming =
    totalsByType.saleSum +
    totalsByType.saleTax +
    totalsByType.outcomeSum +
    totalsByType.outcomeTax;

  const totalOutgoing =
    totalsByType.incomeSum +
    totalsByType.incomeTax +
    totalsByType.returnsSum +
    totalsByType.returnsTax;

  const netFlow = meta.totalSum;
  const enhancedNetWorth = netFlow + totalSaleProduct;

  // ──── Лист 1: Финансовый обзор ────
  const overviewData: (string | number)[][] = [
    [t("menu.report.summary", "Сводный отчёт")],
    [
      t("common.generated_at", "Сформировано") +
        ": " +
        new Date().toLocaleString("ru-RU"),
    ],
    [],
    [t("common.parameter", "Параметр"), t("common.value", "Значение")],
    [
      t("product.inventory_cost", "Стоимость запасов (по закупке)"),
      fmt(totalIncomeProduct),
    ],
    [
      t("product.inventory_value", "Стоимость запасов (по продаже)"),
      fmt(totalSaleProduct),
    ],
    [
      t("product.potential_profit", "Потенциальная прибыль от запасов"),
      fmt(totalSaleProduct - totalIncomeProduct),
    ],
    [
      t("order.revenue", "Выручка (деньги поступили)"),
      fmt(totalIncoming),
    ],
    [
      t("order.expenses", "Расходы (деньги ушли)"),
      fmt(totalOutgoing),
    ],
    [
      t("order.enhanced_net_worth", "Общая стоимость бизнеса"),
      fmt(enhancedNetWorth),
    ],
  ];
  const overviewSheet = createSheetFromAOA(overviewData, [45, 25]);
  addSheetToWorkbook(
    wb,
    overviewSheet,
    t("order.financial_overview", "Финансовый обзор"),
  );

  // ──── Лист 2: Источники выручки и расходов ────
  const breakdownData: (string | number)[][] = [
    [
      t("order.type", "Тип операции"),
      t("order.amount", "Сумма"),
      t("order.tax", "Налог"),
      t("common.total", "Итого"),
    ],
    [],
    [
      `── ${t("order.revenue_sources", "Источники выручки")} ──`,
      "",
      "",
      "",
    ],
    [
      t("order.type.sale", "Продажа"),
      fmt(totalsByType.saleSum),
      fmt(totalsByType.saleTax),
      fmt(totalsByType.saleSum + totalsByType.saleTax),
    ],
    [
      t("order.type.return_provider", "Возврат поставщику"),
      fmt(totalsByType.outcomeSum),
      fmt(totalsByType.outcomeTax),
      fmt(totalsByType.outcomeSum + totalsByType.outcomeTax),
    ],
    [
      t("order.revenue", "Итого выручка"),
      "",
      "",
      fmt(totalIncoming),
    ],
    [],
    [
      `── ${t("order.expense_sources", "Источники расходов")} ──`,
      "",
      "",
      "",
    ],
    [
      t("order.type.purchase", "Закупка"),
      fmt(totalsByType.incomeSum),
      fmt(totalsByType.incomeTax),
      fmt(totalsByType.incomeSum + totalsByType.incomeTax),
    ],
    [
      t("order.type.customer_return", "Возврат от клиента"),
      fmt(totalsByType.returnsSum),
      fmt(totalsByType.returnsTax),
      fmt(totalsByType.returnsSum + totalsByType.returnsTax),
    ],
    [
      t("order.expenses", "Итого расходы"),
      "",
      "",
      fmt(totalOutgoing),
    ],
  ];
  const breakdownSheet = createSheetFromAOA(breakdownData, [35, 18, 18, 20]);
  addSheetToWorkbook(
    wb,
    breakdownSheet,
    t("order.breakdown", "Детализация"),
  );

  // ──── Лист 3: Статистика ────
  const avgOrder =
    ordersCount > 0 ? Math.abs(meta.totalSum) / ordersCount : 0;
  const margin =
    totalIncomeProduct > 0
      ? ((totalSaleProduct - totalIncomeProduct) / totalIncomeProduct) * 100
      : 0;
  const revenueShare =
    totalIncoming + totalOutgoing > 0
      ? (totalIncoming / (totalIncoming + totalOutgoing)) * 100
      : 0;
  const expenseShare =
    totalIncoming + totalOutgoing > 0
      ? (totalOutgoing / (totalIncoming + totalOutgoing)) * 100
      : 0;

  const statsData: (string | number)[][] = [
    [t("order.quick_stats", "Быстрая статистика")],
    [],
    [t("common.parameter", "Параметр"), t("common.value", "Значение")],
    [t("order.total_orders", "Всего заказов"), ordersCount],
    [t("product.total_products", "Товаров на складе"), products.length],
    [t("order.avg_order", "Средний чек"), fmt(avgOrder)],
    [t("order.total_discount", "Общая скидка"), fmt(meta.totalDiscount)],
    [t("order.total_tax", "Общий налог"), fmt(meta.totalTax)],
    [
      t("product.margin_percentage", "Маржа товаров"),
      `${margin.toFixed(1)}%`,
    ],
    [
      t("order.revenue_share", "Доля выручки"),
      `${revenueShare.toFixed(1)}%`,
    ],
    [
      t("order.expense_share", "Доля расходов"),
      `${expenseShare.toFixed(1)}%`,
    ],
  ];
  const statsSheet = createSheetFromAOA(statsData, [35, 25]);
  addSheetToWorkbook(
    wb,
    statsSheet,
    t("order.quick_stats", "Статистика"),
  );

  // ──── Лист 4: Товары на складе ────
  if (products.length > 0) {
    const productHeader: (string | number)[] = [
      "№",
      t("product.name", "Наименование"),
      t("product.balance", "Остаток"),
      t("product.income_price", "Закупочная цена"),
      t("product.sale_price", "Цена продажи"),
      t("product.income_total", "Стоимость (закупка)"),
      t("product.sale_total", "Стоимость (продажа)"),
    ];

    const productRows: (string | number)[][] = [productHeader];

    products.forEach((product, i) => {
      const incPrice = getIncomePrice(product);
      const salePrice = getSalePrice(product);
      productRows.push([
        i + 1,
        product.name,
        product.balance,
        fmt(incPrice),
        fmt(salePrice),
        fmt(incPrice * product.balance),
        fmt(salePrice * product.balance),
      ]);
    });

    // Итого
    productRows.push([]);
    productRows.push([
      "",
      t("common.total", "Итого"),
      "",
      "",
      "",
      fmt(totalIncomeProduct),
      fmt(totalSaleProduct),
    ]);

    const productSheet = createSheetFromAOA(productRows, [
      5, 30, 12, 18, 18, 20, 20,
    ]);
    addSheetToWorkbook(
      wb,
      productSheet,
      t("product.inventory", "Товары на складе"),
    );
  }

  return workbookToBlob(wb);
}
