import type { ShiftEntity } from "../../model/types";
import { format } from "date-fns";
import { TFunction } from "i18next";
import {
  createEmptyWorkbook,
  createSheetFromAOA,
  addSheetToWorkbook,
  workbookToBlob,
} from "@/shared/lib/export/excel";

/**
 * Вычисление продолжительности смены
 */
function calculateDuration(openDate: string, closeDate: string): string {
  const start = new Date(openDate);
  const end = new Date(closeDate);
  const diff = end.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}ч ${minutes}м`;
}

/**
 * Экспорт детального отчёта смены в Excel (.xlsx) с несколькими листами
 */
export function exportShiftToExcel(
  shift: ShiftEntity,
  t: TFunction
): Blob {
  const wb = createEmptyWorkbook();

  const duration = shift.d_close
    ? calculateDuration(shift.d_open, shift.d_close)
    : t("shift.ongoing", "В работе");

  // ──── Лист 1: Основная информация ────
  const infoData: (string | number)[][] = [
    [t("shift.detailed_report", "Детальный отчёт по смене") + ` #${shift.id?.slice(-8) || ''}`],
    [],
    [t("common.parameter", "Параметр"), t("common.value", "Значение")],
    [t("shift.status", "Статус"), shift.d_close ? t("shift.closed", "Закрыта") : t("shift.open", "Открыта")],
    [t("shift.duration", "Продолжительность"), duration],
    [t("shift.opened_at", "Дата открытия"), format(new Date(shift.d_open), "dd.MM.yyyy HH:mm:ss")],
    [t("shift.closed_at", "Дата закрытия"), shift.d_close ? format(new Date(shift.d_close), "dd.MM.yyyy HH:mm:ss") : "-"],
    [t("shift.opened_by", "Открыл"), shift.user_open.full_name],
    [t("shift.closed_by", "Закрыл"), shift.user_close?.full_name || "-"],
    [],
    [t("common.generated_at", "Сформировано"), format(new Date(), "dd.MM.yyyy HH:mm")],
  ];
  const infoSheet = createSheetFromAOA(infoData, [30, 40]);
  addSheetToWorkbook(wb, infoSheet, t("shift.main_info", "Основная информация"));

  // ──── Лист 2: Резервуары на начало смены ────
  if (shift.data_open && shift.data_open.length > 0) {
    const headers = [
      t("tank.number", "№"),
      t("tank.product", "Продукт"),
      t("tank.temperature", "Темп. (°C)"),
      t("tank.density", "Плотность"),
      t("tank.level", "Уровень (мм)"),
      t("tank.volume", "Объём (л)"),
    ];

    const rows: (string | number)[][] = [headers];
    for (const tank of shift.data_open) {
      rows.push([
        tank.number,
        tank.gas,
        tank.temperature.toFixed(1),
        tank.density.toFixed(3),
        tank.level_current.toFixed(2),
        tank.volume_current.toFixed(2),
      ]);
    }

    const ws = createSheetFromAOA(rows, [8, 20, 14, 14, 16, 16]);
    addSheetToWorkbook(wb, ws, t("shift.data_at_open", "Начало смены"));
  }

  // ──── Лист 3: Резервуары на конец смены ────
  if (shift.data_close && shift.data_close.length > 0) {
    const headers = [
      t("tank.number", "№"),
      t("tank.product", "Продукт"),
      t("tank.temperature", "Темп. (°C)"),
      t("tank.density", "Плотность"),
      t("tank.level", "Уровень (мм)"),
      t("tank.volume", "Объём (л)"),
    ];

    const rows: (string | number)[][] = [headers];
    for (const tank of shift.data_close) {
      rows.push([
        tank.number,
        tank.gas,
        tank.temperature.toFixed(1),
        tank.density.toFixed(3),
        tank.level_current.toFixed(2),
        tank.volume_current.toFixed(2),
      ]);
    }

    const ws = createSheetFromAOA(rows, [8, 20, 14, 14, 16, 16]);
    addSheetToWorkbook(wb, ws, t("shift.data_at_close", "Конец смены"));
  }

  // ──── Лист 4: Данные ТРК по резервуарам ────
  if (shift.data_close && shift.data_close.some(t => t.dispensers_data && t.dispensers_data.length > 0)) {
    const headers = [
      t("tank.number", "Резервуар №"),
      t("tank.product", "Продукт"),
      t("dispenser.name", "ТРК"),
      t("dispenser.nozzle", "Пистолет"),
      t("dispenser.shift_volume", "Объём за смену (л)"),
      t("dispenser.shift_amount", "Сумма за смену"),
    ];

    const rows: (string | number)[][] = [headers];
    for (const tank of shift.data_close) {
      if (tank.dispensers_data && tank.dispensers_data.length > 0) {
        for (const disp of tank.dispensers_data) {
          rows.push([
            tank.number,
            tank.gas,
            disp.dispenser_name,
            disp.nozzle_addres,
            disp.shift_volume.toFixed(2),
            disp.shift_amount.toFixed(2),
          ]);
        }
      }
    }

    const ws = createSheetFromAOA(rows, [14, 20, 18, 14, 20, 20]);
    addSheetToWorkbook(wb, ws, t("dispenser.data", "Данные ТРК"));
  }

  // ──── Лист 5: Изменение объёмов ────
  if (shift.data_open && shift.data_close) {
    const headers = [
      t("tank.number", "№"),
      t("tank.product", "Продукт"),
      t("shift.volume_start", "Объём начало (л)"),
      t("shift.volume_end", "Объём конец (л)"),
      t("shift.volume_diff", "Разница (л)"),
      t("shift.dispensed", "Отпущено по ТРК (л)"),
    ];

    const rows: (string | number)[][] = [headers];
    for (const tankOpen of shift.data_open) {
      const tankClose = shift.data_close.find(tc => tc.number === tankOpen.number);
      if (tankClose) {
        const diff = tankOpen.volume_current - tankClose.volume_current;
        const totalDispensed = tankClose.dispensers_data?.reduce((sum, d) => sum + d.shift_volume, 0) || 0;

        rows.push([
          tankOpen.number,
          tankOpen.gas,
          tankOpen.volume_current.toFixed(2),
          tankClose.volume_current.toFixed(2),
          `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`,
          totalDispensed.toFixed(2),
        ]);
      }
    }

    const ws = createSheetFromAOA(rows, [8, 20, 20, 20, 16, 22]);
    addSheetToWorkbook(wb, ws, t("shift.volume_difference", "Изменение объёмов"));
  }

  return workbookToBlob(wb);
}
