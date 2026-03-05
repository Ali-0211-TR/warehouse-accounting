import { TFunction } from "i18next";
import type { OrderEntity } from "../../model/types";
import {
  createEmptyWorkbook,
  createSheetFromAOA,
  addSheetToWorkbook,
  workbookToBlob,
} from "@/shared/lib/export/excel";

/**
 * Форматирует сумму
 */
function formatCurrency(amount: number): string {
  return Number(amount).toLocaleString("ru-RU");
}

/**
 * Форматирует дату
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ru-RU");
}

/**
 * Получает название типа заказа
 */
function getOrderTypeName(orderType: string, t: TFunction): string {
  const typeMap: Record<string, string> = {
    Sale: t("order.type.sale", "Продажа"),
    Income: t("order.type.income", "Приход"),
    Outcome: t("order.type.outcome", "Возврат поставщику"),
    Returns: t("order.type.returns", "Возврат от клиента"),
    FuelSale: t("order.type.fuel_sale", "Продажа топлива"),
  };
  return typeMap[orderType] || orderType;
}

/**
 * Экспорт данных движения товаров в Excel (.xlsx) с несколькими листами
 */
export function exportProductMovementsToExcel(
  data: OrderEntity[],
  t: TFunction,
  dateRange?: { from: string; to: string } | null
): Blob {
  const wb = createEmptyWorkbook();

  // Расчёт итогов
  const totals = data.reduce(
    (acc, order) => ({
      totalOrders: acc.totalOrders + 1,
      totalSum: acc.totalSum + order.summ,
      totalTax: acc.totalTax + order.tax,
      totalWithTax: acc.totalWithTax + order.summ + order.tax,
    }),
    { totalOrders: 0, totalSum: 0, totalTax: 0, totalWithTax: 0 }
  );

  // Период отчёта
  let periodText = t("product_movements.all_time", "За всё время");
  if (dateRange?.from && dateRange?.to) {
    periodText = `${t("common.period", "Период")}: ${new Date(dateRange.from).toLocaleDateString("ru-RU")} - ${new Date(dateRange.to).toLocaleDateString("ru-RU")}`;
  }

  // ──── Лист 1: Сводная информация ────
  const summaryData: (string | number)[][] = [
    [t("menu.report.product_movements", "Отчёт по движению товаров")],
    [periodText],
    [t("common.generated_at", "Сформировано") + ": " + new Date().toLocaleString("ru-RU")],
    [],
    [t("common.parameter", "Параметр"), t("common.value", "Значение")],
    [t("product_movements.total_orders", "Всего документов"), totals.totalOrders],
    [t("product_movements.total_sum", "Общая сумма"), formatCurrency(totals.totalSum) + ` ${t("currency.sum", "сум")}`],
    [t("product_movements.total_tax", "Общий налог"), formatCurrency(totals.totalTax) + ` ${t("currency.sum", "сум")}`],
    [t("product_movements.total_with_tax", "Итого с налогом"), formatCurrency(totals.totalWithTax) + ` ${t("currency.sum", "сум")}`],
  ];
  const summarySheet = createSheetFromAOA(summaryData, [30, 30]);
  addSheetToWorkbook(wb, summarySheet, t("product_movements.summary", "Сводка"));

  // ──── Лист 2: Детальные данные ────
  const detailHeaders = [
    t("order.id", "№"),
    t("order.type", "Тип"),
    t("order.date", "Дата"),
    t("order.client", "Контрагент"),
    t("order.sum", "Сумма"),
    t("order.tax", "Налог"),
    t("order.total", "Итого"),
  ];

  const detailRows: (string | number)[][] = [detailHeaders];
  for (const order of data) {
    detailRows.push([
      order.id || "-",
      getOrderTypeName(order.order_type, t),
      formatDate(order.d_move),
      order.client?.name || "-",
      formatCurrency(order.summ),
      formatCurrency(order.tax),
      formatCurrency(order.summ + order.tax),
    ]);
  }

  // Итоговая строка
  detailRows.push([
    t("common.total", "Итого"),
    "",
    "",
    "",
    formatCurrency(totals.totalSum),
    formatCurrency(totals.totalTax),
    formatCurrency(totals.totalWithTax),
  ]);

  const detailSheet = createSheetFromAOA(detailRows, [12, 22, 20, 24, 18, 18, 18]);
  addSheetToWorkbook(wb, detailSheet, t("order.list", "Документы"));

  return workbookToBlob(wb);
}
