import type { PrintConfig } from "@/shared/lib/print";
import { TFunction } from "i18next";
import type { OrderEntity } from "../model/types";

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
function getOrderTypeName(t: TFunction, orderType: string): string {
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
 * Создаёт конфигурацию печати для отчёта движения товаров
 */
export function createProductMovementPrintConfig(
  data: OrderEntity[],
  t: TFunction,
  dateRange?: { from: string; to: string } | null
): PrintConfig<OrderEntity> {
  // Расчёт итогов
  const totals = data.reduce(
    (acc, order) => ({
      totalOrders: acc.totalOrders + 1,
      totalSum: acc.totalSum + order.summ,
      totalTax: acc.totalTax + order.tax,
      totalWithTax: acc.totalWithTax + order.summ + order.tax,
    }),
    {
      totalOrders: 0,
      totalSum: 0,
      totalTax: 0,
      totalWithTax: 0,
    }
  );

  // Формируем период отчёта
  let periodText = t("product_movements.all_time", "За всё время");
  if (dateRange?.from && dateRange?.to) {
    periodText = `${t("common.period", "Период")}: ${new Date(
      dateRange.from
    ).toLocaleDateString("ru-RU")} - ${new Date(
      dateRange.to
    ).toLocaleDateString("ru-RU")}`;
  }

  const customHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <!-- Заголовок -->
      <h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
        ${t("menu.report.product_movements", "Отчёт по движению товаров")}
      </h1>
      <p style="text-align: center; color: #6b7280; margin-bottom: 10px;">
        ${periodText}
      </p>
      <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
        ${t("common.generated_at", "Сформировано")}: ${new Date().toLocaleString(
    "ru-RU"
  )}
      </p>

      <!-- Сводная информация -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px;">
        <h2 style="color: #0c4a6e; margin-bottom: 15px; font-size: 18px;">
          ${t("product_movements.summary", "Сводная информация")}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "product_movements.total_orders",
              "Всего документов"
            )}:</td>
            <td style="padding: 8px; text-align: right;">${
              totals.totalOrders
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "product_movements.total_sum",
              "Общая сумма"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #0284c7; font-weight: bold;">
              ${formatCurrency(totals.totalSum)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "product_movements.total_tax",
              "Общий налог"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #7c3aed;">
              ${formatCurrency(totals.totalTax)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "product_movements.total_with_tax",
              "Итого с налогом"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #16a34a; font-weight: bold;">
              ${formatCurrency(totals.totalWithTax)} ${t("currency.sum", "сум")}
            </td>
          </tr>
        </table>
      </div>

      <!-- Таблица данных -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 9px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${t(
              "order.id",
              "№"
            )}</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${t(
              "order.type",
              "Тип"
            )}</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${t(
              "order.date",
              "Дата"
            )}</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${t(
              "order.client",
              "Контрагент"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "order.sum",
              "Сумма"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "order.tax",
              "Налог"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "order.total",
              "Итого"
            )}</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (order) => `
            <tr>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${
                order.id || "-"
              }</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${getOrderTypeName(
                t,
                order.order_type
              )}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${formatDate(
                order.d_move ?? ""
              )}</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${
                order.client?.name || "-"
              }</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(
                order.summ
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(
                order.tax
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">${formatCurrency(
                order.summ + order.tax
              )}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr style="background-color: #f9fafb; font-weight: bold;">
            <td colspan="4" style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">
              ${t("common.total", "Итого")}:
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #0284c7;">
              ${formatCurrency(totals.totalSum)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #7c3aed;">
              ${formatCurrency(totals.totalTax)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #16a34a;">
              ${formatCurrency(totals.totalWithTax)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return {
    title: t("menu.report.product_movements", "Отчёт по движению товаров"),
    pageSize: "A4",
    orientation: "landscape",
    columns: [],
    customHTML,
  };
}
