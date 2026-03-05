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
import type { FuelMovementData } from "../fuel-movement-print-config";

/**
 * Форматирует объём
 */
function formatVolume(volume: number): string {
  return (volume / 100).toFixed(2);
}

/**
 * Форматирует сумму
 */
function formatCurrency(amount: number): string {
  return Number(amount).toLocaleString("ru-RU");
}

/**
 * Создаёт таблицу Word для данных движения топлива
 */
function createWordTable(
  t: TFunction,
  data: FuelMovementData[]
): Table {
  // Расчёт итогов
  const totals = data.reduce(
    (acc, item) => ({
      shiftVolume: acc.shiftVolume + item.shiftVolume,
      shiftAmount: acc.shiftAmount + item.shiftAmount,
      totalVolume: acc.totalVolume + item.totalVolume,
      totalAmount: acc.totalAmount + item.totalAmount,
      foVolume: acc.foVolume + item.foVolume,
      foAmount: acc.foAmount + item.foAmount,
    }),
    {
      shiftVolume: 0,
      shiftAmount: 0,
      totalVolume: 0,
      totalAmount: 0,
      foVolume: 0,
      foAmount: 0,
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
            text: t("fuel_movements.dispenser", "Колонка"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 12, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.nozzle", "Сопло"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 7, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.tank", "Резервуар"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 12, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.shift_volume_short", "Объём смены (л)"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 11, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.shift_amount_short", "Сумма смены"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 12, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.total_volume_short", "Общ. объём (л)"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 11, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.total_amount_short", "Общ. сумма"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 12, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.db_volume_short", "БД объём (л)"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 11, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: t("fuel_movements.db_amount_short", "БД сумма"),
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        width: { size: 12, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  // Строки данных
  const dataRows = data.map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: item.dispenserName })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: item.nozzleAddress.toString(),
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.tank })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatVolume(item.shiftVolume),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatCurrency(item.shiftAmount),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatVolume(item.totalVolume),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatCurrency(item.totalAmount),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatVolume(item.foVolume),
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: formatCurrency(item.foAmount),
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
        columnSpan: 3,
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatVolume(totals.shiftVolume),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatCurrency(totals.shiftAmount),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatVolume(totals.totalVolume),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatCurrency(totals.totalAmount),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatVolume(totals.foVolume),
            alignment: AlignmentType.RIGHT,
            style: "strong",
          }),
        ],
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
      }),
      new TableCell({
        children: [
          new Paragraph({
            text: formatCurrency(totals.foAmount),
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
 * Экспортирует данные движения топлива в Word
 */
export async function exportFuelMovementsToWord(
  t: TFunction,
  data: FuelMovementData[],
  dateRange?: { from: string; to: string } | null
): Promise<Blob> {
  // Формируем период отчёта
  let periodText = t("fuel_movements.all_time", "За всё время");
  if (dateRange?.from && dateRange?.to) {
    periodText = `${t("common.period", "Период")}: ${new Date(
      dateRange.from
    ).toLocaleDateString("ru-RU")} - ${new Date(
      dateRange.to
    ).toLocaleDateString("ru-RU")}`;
  }

  // Расчёт итогов для сводки
  const totals = data.reduce(
    (acc, item) => ({
      shiftVolume: acc.shiftVolume + item.shiftVolume,
      shiftAmount: acc.shiftAmount + item.shiftAmount,
      totalVolume: acc.totalVolume + item.totalVolume,
      totalAmount: acc.totalAmount + item.totalAmount,
      foVolume: acc.foVolume + item.foVolume,
      foAmount: acc.foAmount + item.foAmount,
    }),
    {
      shiftVolume: 0,
      shiftAmount: 0,
      totalVolume: 0,
      totalAmount: 0,
      foVolume: 0,
      foAmount: 0,
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
            text: t("menu.report.fuel_movements", "Отчёт по движению топлива"),
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
            text: t("fuel_movements.summary", "Сводная информация"),
            style: "Heading2",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t("fuel_movements.total_nozzles", "Всего сопел") + ": ",
                bold: true,
              }),
              new TextRun(data.length.toString()),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  t("fuel_movements.total_shift_volume", "Объём за смену") +
                  ": ",
                bold: true,
              }),
              new TextRun(
                formatVolume(totals.shiftVolume) +
                  " " +
                  t("common.liters", "л")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  t("fuel_movements.total_shift_amount", "Сумма за смену") +
                  ": ",
                bold: true,
              }),
              new TextRun(
                formatCurrency(totals.shiftAmount) +
                  " " +
                  t("currency.sum", "сум")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  t("fuel_movements.total_volume", "Общий объём") + ": ",
                bold: true,
              }),
              new TextRun(
                formatVolume(totals.totalVolume) +
                  " " +
                  t("common.liters", "л")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t("fuel_movements.total_amount", "Общая сумма") + ": ",
                bold: true,
              }),
              new TextRun(
                formatCurrency(totals.totalAmount) +
                  " " +
                  t("currency.sum", "сум")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t("fuel_movements.db_volume", "Объём БД") + ": ",
                bold: true,
              }),
              new TextRun(
                formatVolume(totals.foVolume) + " " + t("common.liters", "л")
              ),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: t("fuel_movements.db_amount", "Сумма БД") + ": ",
                bold: true,
              }),
              new TextRun(
                formatCurrency(totals.foAmount) + " " + t("currency.sum", "сум")
              ),
            ],
            spacing: { after: 400 },
          }),
          // Детальная таблица
          new Paragraph({
            text: t("fuel_movements.details", "Детальная информация"),
            style: "Heading2",
            spacing: { after: 200 },
          }),
          createWordTable(t, data),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
