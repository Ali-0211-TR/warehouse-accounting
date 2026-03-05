import type { OrderEntity } from "../../model/types";
import { TFunction } from "i18next";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";

// Инициализируем шрифты (Roboto с поддержкой кириллицы)
(pdfMake as any).vfs = pdfFonts;

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
function getOrderTypeName(
  orderType: string, t: TFunction
): string {
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
 * Экспортирует данные движения товаров в PDF
 */
export function exportProductMovementsToPDF(
  data: OrderEntity[],
  t: TFunction,
  dateRange?: { from: string; to: string } | null
): Promise<Blob> {


  return new Promise((resolve, reject) => {
    try {
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

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [20, 60, 20, 40],
    header: {
      margin: [20, 20, 20, 10],
      stack: [
        {
          text: t("menu.report.product_movements", "Отчёт по движению товаров"),
          style: "header",
          alignment: "center",
        },
        {
          text: periodText,
          style: "subheader",
          alignment: "center",
          margin: [0, 5, 0, 0],
        },
        {
          text:
            t("common.generated_at", "Сформировано") +
            ": " +
            new Date().toLocaleString("ru-RU"),
          fontSize: 8,
          alignment: "center",
          margin: [0, 3, 0, 0],
        },
      ],
    },
    content: [
      // Сводная информация
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              {
                text: t("product_movements.summary", "Сводная информация"),
                colSpan: 2,
                style: "tableHeader",
                fillColor: "#dbeafe",
                alignment: "center",
              },
              {},
            ],
            [
              t("product_movements.total_orders", "Всего документов") + ":",
              { text: totals.totalOrders.toString(), alignment: "right" },
            ],
            [
              t("product_movements.total_sum", "Общая сумма") + ":",
              {
                text:
                  formatCurrency(totals.totalSum) +
                  " " +
                  t("currency.sum", "сум"),
                alignment: "right",
                bold: true,
                color: "#0284c7",
              },
            ],
            [
              t("product_movements.total_tax", "Общий налог") + ":",
              {
                text:
                  formatCurrency(totals.totalTax) +
                  " " +
                  t("currency.sum", "сум"),
                alignment: "right",
                color: "#7c3aed",
              },
            ],
            [
              t("product_movements.total_with_tax", "Итого с налогом") + ":",
              {
                text:
                  formatCurrency(totals.totalWithTax) +
                  " " +
                  t("currency.sum", "сум"),
                alignment: "right",
                bold: true,
                color: "#16a34a",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#cbd5e1",
          vLineColor: () => "#cbd5e1",
        },
        margin: [0, 0, 0, 15],
      },
      // Таблица данных
      {
        table: {
          headerRows: 1,
          widths: [60, 80, 80, 100, 70, 70, 80],
          body: [
            [
              {
                text: t("order.id", "№"),
                style: "tableHeader",
              },
              {
                text: t("order.type", "Тип"),
                style: "tableHeader",
              },
              {
                text: t("order.date", "Дата"),
                style: "tableHeader",
              },
              {
                text: t("order.client", "Контрагент"),
                style: "tableHeader",
              },
              {
                text: t("order.sum", "Сумма"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("order.tax", "Налог"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("order.total", "Итого"),
                style: "tableHeader",
                alignment: "right",
              },
            ],
            ...data.map((order) => [
              { text: order.id || "-", fontSize: 7 },
              { text: getOrderTypeName(order.order_type, t), fontSize: 7 },
              { text: formatDate(order.d_move), fontSize: 7 },
              { text: order.client?.name || "-", fontSize: 7 },
              {
                text: formatCurrency(order.summ),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatCurrency(order.tax),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatCurrency(order.summ + order.tax),
                fontSize: 7,
                alignment: "right",
                bold: true,
              },
            ] as any),
            // Итого
            [
              {
                text: t("common.total", "Итого") + ":",
                colSpan: 4,
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
              },
              {},
              {},
              {},
              {
                text: formatCurrency(totals.totalSum),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#0284c7",
              },
              {
                text: formatCurrency(totals.totalTax),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#7c3aed",
              },
              {
                text: formatCurrency(totals.totalWithTax),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#16a34a",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#cbd5e1",
          vLineColor: () => "#cbd5e1",
        },
      },
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
      },
      subheader: {
        fontSize: 10,
        color: "#6b7280",
      },
      tableHeader: {
        fillColor: "#f3f4f6",
        bold: true,
        fontSize: 8,
      },
    },
    defaultStyle: {
      font: "Roboto",
    },
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);

  pdfDocGenerator.getBlob((blob) => {
    resolve(blob);
  });
} catch (error) {
  console.error("Error creating PDF:", error);
  reject(error);
}
});
}
