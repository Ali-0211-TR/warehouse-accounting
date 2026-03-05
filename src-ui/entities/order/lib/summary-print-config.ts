import type { PrintConfig } from "@/shared/lib/print";
import { TFunction } from "i18next";
import type { ProductEntity } from "@/entities/product";
import { getIncomePrice, getSalePrice } from "@/entities/product";

/**
 * Интерфейс данных для сводного отчёта
 */
export interface SummaryReportData {
  // Итоги по типам операций
  totalsByType: {
    saleSum: number;
    saleTax: number;
    incomeSum: number;
    incomeTax: number;
    outcomeSum: number;
    outcomeTax: number;
    returnsSum: number;
    returnsTax: number;
  };
  // Общие итоги
  meta: {
    totalSum: number;
    totalTax: number;
    totalDiscount: number;
  };
  // Количество заказов
  ordersCount: number;
  // Товары для расчёта складских данных
  products: ProductEntity[];
}

/**
 * Форматирует сумму для отображения
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Создаёт конфигурацию печати для сводного отчёта
 */
export function createSummaryReportPrintConfig(
  t: TFunction,
  data: SummaryReportData
): PrintConfig<any> {
  const { totalsByType, meta, ordersCount, products } = data;

  // Расчёт складских показателей
  const [totalSaleProduct, totalIncomeProduct] = products.reduce(
    (sum, product) => {
      return [
        sum[0] + getSalePrice(product) * product.balance,
        sum[1] + getIncomePrice(product) * product.balance,
      ];
    },
    [0, 0]
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

  // Создаём HTML для печати
  const customHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <!-- Заголовок -->
      <h1 style="text-align: center; color: #1f2937; margin-bottom: 30px;">
        ${t("menu.report.summary", "Сводный отчёт")}
      </h1>
      <p style="text-align: center; color: #6b7280; margin-bottom: 40px;">
        ${t("common.generated_at", "Сформировано")}: ${new Date().toLocaleString("ru-RU")}
      </p>

      <!-- Финансовый обзор -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          ${t("order.financial_overview", "Финансовый обзор")}
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">${t("common.parameter", "Параметр")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("common.value", "Значение")}</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              ${t("product.inventory_cost", "Стоимость запасов (по закупке)")}
            </td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #2563eb; font-weight: bold;">
              ${formatAmount(totalIncomeProduct)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              ${t("product.inventory_value", "Стоимость запасов (по продаже)")}
            </td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #7c3aed; font-weight: bold;">
              ${formatAmount(totalSaleProduct)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              ${t("product.potential_profit", "Потенциальная прибыль от запасов")}
            </td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #6366f1; font-weight: bold;">
              ${formatAmount(totalSaleProduct - totalIncomeProduct)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr style="background-color: #f0fdf4;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              ${t("order.revenue", "Выручка (деньги поступили)")}
            </td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #16a34a; font-weight: bold;">
              ${formatAmount(totalIncoming)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr style="background-color: #fef2f2;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              ${t("order.expenses", "Расходы (деньги ушли)")}
            </td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">
              ${formatAmount(totalOutgoing)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr style="background-color: ${enhancedNetWorth >= 0 ? "#ecfdf5" : "#fff7ed"};">
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">
              ${t("order.enhanced_net_worth", "Общая стоимость бизнеса")}
            </td>
            <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: ${
              enhancedNetWorth >= 0 ? "#059669" : "#ea580c"
            }; font-weight: bold; font-size: 18px;">
              ${enhancedNetWorth >= 0 ? "+" : ""}${formatAmount(enhancedNetWorth)} ${t("currency.sum", "сум")}
            </td>
          </tr>
        </table>
      </div>

      <!-- Детализация выручки -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
          ${t("order.revenue_sources", "Источники выручки")}
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">${t("order.type", "Тип операции")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("order.amount", "Сумма")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("order.tax", "Налог")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("common.total", "Итого")}</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.type.sale", "Продажа")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.saleSum)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.saleTax)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${formatAmount(totalsByType.saleSum + totalsByType.saleTax)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.type.return_provider", "Возврат поставщику")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.outcomeSum)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.outcomeTax)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${formatAmount(totalsByType.outcomeSum + totalsByType.outcomeTax)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Детализация расходов -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
          ${t("order.expense_sources", "Источники расходов")}
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">${t("order.type", "Тип операции")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("order.amount", "Сумма")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("order.tax", "Налог")}</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${t("common.total", "Итого")}</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.type.purchase", "Закупка")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.incomeSum)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.incomeTax)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${formatAmount(totalsByType.incomeSum + totalsByType.incomeTax)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.type.customer_return", "Возврат от клиента")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.returnsSum)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatAmount(totalsByType.returnsTax)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${formatAmount(totalsByType.returnsSum + totalsByType.returnsTax)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Статистика -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
          ${t("order.quick_stats", "Быстрая статистика")}
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.total_orders", "Всего заказов")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">${ordersCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("product.total_products", "Товаров на складе")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">${products.length}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.avg_order", "Средний чек")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${ordersCount > 0 ? formatAmount(Math.abs(meta.totalSum) / ordersCount) : "0"} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("order.total_discount", "Общая скидка")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${formatAmount(meta.totalDiscount)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${t("product.margin_percentage", "Маржа товаров")}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">
              ${
                totalIncomeProduct > 0
                  ? `${(
                      ((totalSaleProduct - totalIncomeProduct) /
                        totalIncomeProduct) *
                      100
                    ).toFixed(1)}%`
                  : "0%"
              }
            </td>
          </tr>
        </table>
      </div>

      <!-- Финансовое здоровье -->
      <div style="margin-top: 40px; padding: 20px; background-color: ${
        enhancedNetWorth >= 0 ? "#ecfdf5" : "#fff7ed"
      }; border: 2px solid ${enhancedNetWorth >= 0 ? "#059669" : "#ea580c"}; border-radius: 8px;">
        <h3 style="color: ${enhancedNetWorth >= 0 ? "#059669" : "#ea580c"}; margin-bottom: 15px;">
          ${t("order.financial_health", "Финансовое здоровье")}
        </h3>
        <p style="font-size: 16px; margin-bottom: 10px;">
          <strong>${t("order.business_value_ratio", "Коэффициент стоимости бизнеса")}:</strong>
          ${
            totalIncoming > 0
              ? `${(
                  (enhancedNetWorth / (totalIncoming + totalSaleProduct)) *
                  100
                ).toFixed(1)}%`
              : "0%"
          }
        </p>
        <p style="font-size: 16px; margin-bottom: 10px;">
          <strong>${t("order.revenue_share", "Доля выручки")}:</strong>
          ${
            totalIncoming + totalOutgoing > 0
              ? `${(
                  (totalIncoming / (totalIncoming + totalOutgoing)) *
                  100
                ).toFixed(1)}%`
              : "0%"
          }
        </p>
        <p style="font-size: 16px; margin-bottom: 10px;">
          <strong>${t("order.expense_share", "Доля расходов")}:</strong>
          ${
            totalIncoming + totalOutgoing > 0
              ? `${(
                  (totalOutgoing / (totalIncoming + totalOutgoing)) *
                  100
                ).toFixed(1)}%`
              : "0%"
          }
        </p>
        <p style="font-size: 18px; font-weight: bold; color: ${
          enhancedNetWorth >= 0 ? "#059669" : "#dc2626"
        }; margin-top: 20px;">
          ${
            enhancedNetWorth >= 0
              ? enhancedNetWorth > totalOutgoing * 1.5
                ? t("order.excellent_position", "🚀 Отличная финансовая позиция")
                : enhancedNetWorth > totalOutgoing * 1.2
                ? t("order.strong_position", "✅ Сильная позиция")
                : t("order.stable_position", "📈 Стабильная позиция")
              : t("order.improvement_needed", "📉 Требуется пересмотр расходов и цен")
          }
        </p>
      </div>
    </div>
  `;

  return {
    title: t("menu.report.summary", "Сводный отчёт"),
    pageSize: "A4",
    orientation: "portrait",
    columns: [],
    customHTML,
  };
}
