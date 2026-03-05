import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { TFunction } from "i18next";
import type { FuelMovementData } from "../fuel-movement-print-config";

// Инициализируем шрифты (Roboto с поддержкой кириллицы)
(pdfMake as any).vfs = pdfFonts;

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
 * Экспортирует данные движения топлива в PDF
 */
export function exportFuelMovementsToPDF(
  t: TFunction,
  data: FuelMovementData[],
  dateRange?: { from: string; to: string } | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
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

  // Формируем период отчёта
  let periodText = t("fuel_movements.all_time", "За всё время");
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
          text: t("menu.report.fuel_movements", "Отчёт по движению топлива"),
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
                text: t("fuel_movements.summary", "Сводная информация"),
                colSpan: 2,
                style: "tableHeader",
                fillColor: "#dbeafe",
                alignment: "center",
              },
              {},
            ],
            [
              t("fuel_movements.total_nozzles", "Всего сопел") + ":",
              { text: data.length.toString(), alignment: "right" },
            ],
            [
              t("fuel_movements.total_shift_volume", "Объём за смену") + ":",
              {
                text:
                  formatVolume(totals.shiftVolume) +
                  " " +
                  t("common.liters", "л"),
                alignment: "right",
                bold: true,
                color: "#0284c7",
              },
            ],
            [
              t("fuel_movements.total_shift_amount", "Сумма за смену") + ":",
              {
                text:
                  formatCurrency(totals.shiftAmount) +
                  " " +
                  t("currency.sum", "сум"),
                alignment: "right",
                bold: true,
                color: "#0284c7",
              },
            ],
            [
              t("fuel_movements.total_volume", "Общий объём") + ":",
              {
                text:
                  formatVolume(totals.totalVolume) +
                  " " +
                  t("common.liters", "л"),
                alignment: "right",
                bold: true,
                color: "#16a34a",
              },
            ],
            [
              t("fuel_movements.total_amount", "Общая сумма") + ":",
              {
                text:
                  formatCurrency(totals.totalAmount) +
                  " " +
                  t("currency.sum", "сум"),
                alignment: "right",
                bold: true,
                color: "#16a34a",
              },
            ],
            [
              t("fuel_movements.db_volume", "Объём БД") + ":",
              {
                text:
                  formatVolume(totals.foVolume) + " " + t("common.liters", "л"),
                alignment: "right",
                color: "#7c3aed",
              },
            ],
            [
              t("fuel_movements.db_amount", "Сумма БД") + ":",
              {
                text:
                  formatCurrency(totals.foAmount) +
                  " " +
                  t("currency.sum", "сум"),
                alignment: "right",
                color: "#7c3aed",
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
          widths: [60, 30, 50, 45, 55, 45, 55, 45, 50, 40],
          body: [
            [
              {
                text: t("fuel_movements.dispenser", "Колонка"),
                style: "tableHeader",
              },
              {
                text: t("fuel_movements.nozzle", "Сопло"),
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: t("fuel_movements.tank", "Резервуар"),
                style: "tableHeader",
              },
              {
                text: t("fuel_movements.shift_volume_short", "Объём\nсмены (л)"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("fuel_movements.shift_amount_short", "Сумма\nсмены"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("fuel_movements.total_volume_short", "Общ.\nобъём (л)"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("fuel_movements.total_amount_short", "Общ.\nсумма"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("fuel_movements.db_volume_short", "БД\nобъём (л)"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("fuel_movements.db_amount_short", "БД\nсумма"),
                style: "tableHeader",
                alignment: "right",
              },
              {
                text: t("common.status", "Статус"),
                style: "tableHeader",
                alignment: "center",
              },
            ],
            ...data.map((item) => [
              { text: item.dispenserName, fontSize: 7 },
              {
                text: item.nozzleAddress.toString(),
                fontSize: 7,
                alignment: "center",
              },
              { text: item.tank, fontSize: 7 },
              {
                text: formatVolume(item.shiftVolume),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatCurrency(item.shiftAmount),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatVolume(item.totalVolume),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatCurrency(item.totalAmount),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatVolume(item.foVolume),
                fontSize: 7,
                alignment: "right",
              },
              {
                text: formatCurrency(item.foAmount),
                fontSize: 7,
                alignment: "right",
              },
              {
                text:
                  item.status === "online"
                    ? t("common.online", "Онлайн")
                    : t("common.offline", "Оффлайн"),
                fontSize: 7,
                alignment: "center",
                color: item.status === "online" ? "#16a34a" : "#dc2626",
              },
            ] as any),
            // Итого
            [
              {
                text: t("common.total", "Итого") + ":",
                colSpan: 3,
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
              },
              {},
              {},
              {
                text: formatVolume(totals.shiftVolume),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#0284c7",
              },
              {
                text: formatCurrency(totals.shiftAmount),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#0284c7",
              },
              {
                text: formatVolume(totals.totalVolume),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#16a34a",
              },
              {
                text: formatCurrency(totals.totalAmount),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#16a34a",
              },
              {
                text: formatVolume(totals.foVolume),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#7c3aed",
              },
              {
                text: formatCurrency(totals.foAmount),
                alignment: "right",
                bold: true,
                fillColor: "#f9fafb",
                color: "#7c3aed",
              },
              { text: "", fillColor: "#f9fafb" },
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
  reject(error);
}
});
}
