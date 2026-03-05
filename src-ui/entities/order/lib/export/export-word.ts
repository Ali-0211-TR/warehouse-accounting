import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";
import { TFunction } from "i18next";
import type { OrderEntity } from "../../model/types";

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
 * Создаёт таблицу Word для данных движения товаров
 */
function createWordTable(
  data: OrderEntity[],
  t: TFunction,
): Table {
  // Расчёт итогов
  const totals = data.reduce(
    (acc, order) => ({
      totalSum: acc.totalSum + order.summ,
      totalTax: acc.totalTax + order.tax,
      totalWithTax: acc.totalWithTax + order.summ + order.tax,
    }),
    {
      totalSum: 0,
      totalTax: 0,
      totalWithTax: 0,
    }
  );

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "CCCCCC",
  };

  // Заголовок таблицы
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.id", "№"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.type", "Тип"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 15, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.date", "Дата"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.client", "Контрагент"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.sum", "Сумма"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 13, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.tax", "Налог"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 12, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("order.total", "Итого"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 15, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  // Строки данных
  const dataRows = data.map(
    (order) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: order.id || "-" })],
          }),
          new TableCell({
            children: [
              new Paragraph({ text: getOrderTypeName(order.order_type, t) }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ text: formatDate(order.d_move) })],
          }),
          new TableCell({
            children: [
              new Paragraph({ text: order.client?.name || "-" }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatCurrency(order.summ),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatCurrency(order.tax),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatCurrency(order.summ + order.tax),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      })
  );

  // Строка итогов
  const totalsRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            text: t("common.total", "Итого") + ":",
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
        columnSpan: 4,
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatCurrency(totals.totalSum),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatCurrency(totals.totalTax),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatCurrency(totals.totalWithTax),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
    ],
  });

  return new Table({
    rows: [headerRow, ...dataRows, totalsRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
      insideHorizontal: borderStyle,
      insideVertical: borderStyle,
    },
  });
}

/**
 * Экспортирует данные движения товаров в Word
 */
export async function exportProductMovementsToWord(
  data: OrderEntity[],
  t: TFunction,
  dateRange?: { from: string; to: string } | null
): Promise<Blob> {
  // Формируем период отчёта
  let periodText = t("product_movements.all_time", "За всё время");
  if (dateRange?.from && dateRange?.to) {
    periodText = `${t("common.period", "Период")}: ${new Date(
      dateRange.from
    ).toLocaleDateString("ru-RU")} - ${new Date(
      dateRange.to
    ).toLocaleDateString("ru-RU")}`;
  }

  // Расчёт итогов для сводки
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

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Заголовок
          new Paragraph({
            text: t("menu.report.product_movements", "Отчёт по движению товаров"),
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: "Heading1",
          }),
          new Paragraph({
            text: periodText,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text:
              t("common.generated_at", "Сформировано") +
              ": " +
              new Date().toLocaleString("ru-RU"),
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Сводная информация
          new Paragraph({
            text: t("product_movements.summary", "Сводная информация"),
            style: "Heading2",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  t("product_movements.total_orders", "Всего документов") +
                  ": ",
                bold: true,
              }),
              new TextRun(totals.totalOrders.toString()),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t("product_movements.total_sum", "Общая сумма") + ": ",
                bold: true,
              }),
              new TextRun(
                formatCurrency(totals.totalSum) + " " + t("currency.sum", "сум")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t("product_movements.total_tax", "Общий налог") + ": ",
                bold: true,
              }),
              new TextRun(
                formatCurrency(totals.totalTax) + " " + t("currency.sum", "сум")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  t("product_movements.total_with_tax", "Итого с налогом") +
                  ": ",
                bold: true,
              }),
              new TextRun(
                formatCurrency(totals.totalWithTax) +
                  " " +
                  t("currency.sum", "сум")
              ),
            ],
            spacing: { after: 400 },
          }),
          // Детальная таблица
          new Paragraph({
            text: t("product_movements.details", "Детальная информация"),
            style: "Heading2",
            spacing: { after: 200 },
          }),
          createWordTable(data, t),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
