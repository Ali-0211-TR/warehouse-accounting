import { TFunction } from "i18next";
import type { FuelMovementData } from "../fuel-movement-print-config";
import {
  createEmptyWorkbook,
  createSheetFromAOA,
  addSheetToWorkbook,
  workbookToBlob,
} from "@/shared/lib/export/excel";

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
 * Экспортирует данные движения топлива в Excel (.xlsx) с несколькими листами
 */
export function exportFuelMovementsToExcel(
  t: TFunction,
  data: FuelMovementData[],
  dateRange?: { from: string; to: string } | null
): Blob {
  const wb = createEmptyWorkbook();

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
    { shiftVolume: 0, shiftAmount: 0, totalVolume: 0, totalAmount: 0, foVolume: 0, foAmount: 0 }
  );

  // Период отчёта
  let periodText = t("fuel_movements.all_time", "За всё время");
  if (dateRange?.from && dateRange?.to) {
    periodText = `${t("common.period", "Период")}: ${new Date(dateRange.from).toLocaleDateString("ru-RU")} - ${new Date(dateRange.to).toLocaleDateString("ru-RU")}`;
  }

  // ──── Лист 1: Сводная информация ────
  const summaryData: (string | number)[][] = [
    [t("menu.report.fuel_movements", "Отчёт по движению топлива")],
    [periodText],
    [t("common.generated_at", "Сформировано") + ": " + new Date().toLocaleString("ru-RU")],
    [],
    [t("common.parameter", "Параметр"), t("common.value", "Значение")],
    [t("fuel_movements.total_nozzles", "Всего сопел"), data.length],
    [t("fuel_movements.total_shift_volume", "Объём за смену"), formatVolume(totals.shiftVolume) + ` ${t("common.liters", "л")}`],
    [t("fuel_movements.total_shift_amount", "Сумма за смену"), formatCurrency(totals.shiftAmount) + ` ${t("currency.sum", "сум")}`],
    [t("fuel_movements.total_volume", "Общий объём"), formatVolume(totals.totalVolume) + ` ${t("common.liters", "л")}`],
    [t("fuel_movements.total_amount", "Общая сумма"), formatCurrency(totals.totalAmount) + ` ${t("currency.sum", "сум")}`],
    [t("fuel_movements.db_volume", "Объём БД"), formatVolume(totals.foVolume) + ` ${t("common.liters", "л")}`],
    [t("fuel_movements.db_amount", "Сумма БД"), formatCurrency(totals.foAmount) + ` ${t("currency.sum", "сум")}`],
  ];
  const summarySheet = createSheetFromAOA(summaryData, [30, 30]);
  addSheetToWorkbook(wb, summarySheet, t("fuel_movements.summary", "Сводка"));

  // ──── Лист 2: Детальные данные ────
  const detailHeaders = [
    t("fuel_movements.dispenser", "Колонка"),
    t("fuel_movements.nozzle", "Сопло"),
    t("fuel_movements.tank", "Резервуар"),
    t("fuel_movements.shift_volume", "Объём смены (л)"),
    t("fuel_movements.shift_amount", "Сумма смены"),
    t("fuel_movements.total_volume", "Общ. объём (л)"),
    t("fuel_movements.total_amount", "Общ. сумма"),
    t("fuel_movements.db_volume", "БД объём (л)"),
    t("fuel_movements.db_amount", "БД сумма"),
    t("common.status", "Статус"),
  ];

  const detailRows: (string | number)[][] = [detailHeaders];
  for (const item of data) {
    detailRows.push([
      item.dispenserName,
      item.nozzleAddress,
      item.tank,
      formatVolume(item.shiftVolume),
      formatCurrency(item.shiftAmount),
      formatVolume(item.totalVolume),
      formatCurrency(item.totalAmount),
      formatVolume(item.foVolume),
      formatCurrency(item.foAmount),
      item.status === "online" ? "Online" : "Offline",
    ]);
  }

  // Итоговая строка
  detailRows.push([
    t("common.total", "Итого"),
    "",
    "",
    formatVolume(totals.shiftVolume),
    formatCurrency(totals.shiftAmount),
    formatVolume(totals.totalVolume),
    formatCurrency(totals.totalAmount),
    formatVolume(totals.foVolume),
    formatCurrency(totals.foAmount),
    "",
  ]);

  const detailSheet = createSheetFromAOA(detailRows, [18, 10, 14, 18, 18, 18, 18, 18, 18, 10]);
  addSheetToWorkbook(wb, detailSheet, t("fuel_movements.details", "Детализация"));

  return workbookToBlob(wb);
}
