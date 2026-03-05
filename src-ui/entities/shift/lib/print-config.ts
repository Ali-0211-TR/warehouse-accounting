import type { PrintConfig, PrintColumnConfig } from "@/shared/lib/print";
import type { ShiftEntity, ShiftData } from "../model/types";
import { format } from "date-fns";
import { TFunction } from "i18next";

/**
 * Конфигурация печати для списка смен
 */
export function createShiftPrintConfig(t: TFunction): PrintConfig<ShiftEntity> {
  return {
    title: t("shift.print_title", "Отчёт по сменам"),
    subtitle: t("shift.print_subtitle", "Список смен"),
    columns: getShiftPrintColumns(t),
    orientation: "landscape",
    pageSize: "A4",
    showFooter: true,
    metadata: {
      [t("common.generated_at", "Сформировано")]: format(new Date(), "dd.MM.yyyy HH:mm"),
    },
  };
}

/**
 * Конфигурация печати для детального отчёта по одной смене
 */
export function createShiftDetailPrintConfig(
  t: TFunction,
  shift: ShiftEntity
): PrintConfig<ShiftEntity> {
  const duration = shift.d_close
    ? calculateDuration(shift.d_open, shift.d_close)
    : t("shift.ongoing", "В работе");

  return {
    title: t("shift.detailed_report", "Детальный отчёт по смене"),
    subtitle: `#${shift.id ? String(shift.id).slice(-8) : ""}`,
    columns: [], // Не используем колонки для детального отчёта
    customHTML: generateShiftDetailHTML(t, shift, duration),
    orientation: "portrait",
    pageSize: "A4",
    showFooter: true,
    metadata: {
      [t("common.generated_at", "Сформировано")]: format(new Date(), "dd.MM.yyyy HH:mm"),
    },
  };
}

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
 * Генерация HTML для детального отчёта смены
 */
function generateShiftDetailHTML(
  t: TFunction,
  shift: ShiftEntity,
  duration: string
): string {
  let html = `
    <style>
      .detail-section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .detail-header {
        background-color: #f0f0f0;
        padding: 10px;
        margin-bottom: 15px;
        border-left: 4px solid #333;
        font-weight: bold;
        font-size: 1.1em;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      .info-item {
        padding: 8px;
        border-bottom: 1px solid #ddd;
      }
      .info-label {
        font-weight: bold;
        color: #555;
        display: inline-block;
        min-width: 150px;
      }
      .info-value {
        color: #000;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        font-size: 0.9em;
      }
      .data-table th {
        background-color: #e8e8e8;
        padding: 10px 8px;
        text-align: left;
        border: 1px solid #ccc;
        font-weight: bold;
      }
      .data-table td {
        padding: 8px;
        border: 1px solid #ddd;
      }
      .data-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.85em;
        font-weight: bold;
      }
      .status-open {
        background-color: #22c55e;
        color: white;
      }
      .status-closed {
        background-color: #ef4444;
        color: white;
      }
      .subsection-title {
        font-weight: bold;
        margin-top: 20px;
        margin-bottom: 10px;
        color: #333;
        font-size: 1.05em;
      }
    </style>
  `;

  // Основная информация о смене
  html += `
    <div class="detail-section">
      <div class="detail-header">${t("shift.main_info", "Основная информация")}</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">${t("shift.status", "Статус")}:</span>
          <span class="info-value">
            <span class="status-badge ${shift.d_close ? 'status-closed' : 'status-open'}">
              ${shift.d_close ? t("shift.closed", "Закрыта") : t("shift.open", "Открыта")}
            </span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">${t("shift.duration", "Продолжительность")}:</span>
          <span class="info-value">${duration}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${t("shift.opened_at", "Дата открытия")}:</span>
          <span class="info-value">${format(new Date(shift.d_open), "dd.MM.yyyy HH:mm:ss")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${t("shift.closed_at", "Дата закрытия")}:</span>
          <span class="info-value">${shift.d_close ? format(new Date(shift.d_close), "dd.MM.yyyy HH:mm:ss") : "-"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${t("shift.opened_by", "Открыл")}:</span>
          <span class="info-value">${shift.user_open.full_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${t("shift.closed_by", "Закрыл")}:</span>
          <span class="info-value">${shift.user_close?.full_name || "-"}</span>
        </div>
      </div>
    </div>
  `;

  // Данные резервуаров на начало смены
  if (shift.data_open && shift.data_open.length > 0) {
    html += generateTankDataSection(t, shift.data_open, t("shift.data_at_open", "Данные резервуаров на начало смены"));
  }

  // Данные резервуаров на конец смены
  if (shift.data_close && shift.data_close.length > 0) {
    html += generateTankDataSection(t, shift.data_close, t("shift.data_at_close", "Данные резервуаров на конец смены"));
  }

  // Разница в объёмах
  if (shift.data_open && shift.data_close) {
    html += generateVolumeDifferenceSection(t, shift.data_open, shift.data_close);
  }

  return html;
}

/**
 * Генерация секции данных резервуаров
 */
function generateTankDataSection(t: TFunction, data: ShiftData[], title: string): string {
  let html = `
    <div class="detail-section">
      <div class="detail-header">${title}</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="text-center">${t("tank.number", "№")}</th>
            <th>${t("tank.product", "Продукт")}</th>
            <th class="text-right">${t("tank.temperature", "Темп. (°C)")}</th>
            <th class="text-right">${t("tank.density", "Плотность")}</th>
            <th class="text-right">${t("tank.level", "Уровень (мм)")}</th>
            <th class="text-right">${t("tank.volume", "Объём (л)")}</th>
            <th class="text-right">${t("tank.water_level", "Уров. воды (мм)")}</th>
            <th class="text-right">${t("tank.water_volume", "Объём воды (л)")}</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const tank of data) {
    html += `
      <tr>
        <td class="text-center">${tank.number}</td>
        <td>${tank.gas}</td>
        <td class="text-right">${tank.temperature.toFixed(1)}</td>
        <td class="text-right">${tank.density.toFixed(3)}</td>
        <td class="text-right">${tank.level_current.toFixed(2)}</td>
        <td class="text-right">${tank.volume_current.toFixed(2)}</td>
        <td class="text-right">${tank.level_water.toFixed(2)}</td>
        <td class="text-right">${tank.volume_water.toFixed(2)}</td>
      </tr>
    `;

    // Данные ТРК для этого резервуара
    if (tank.dispensers_data && tank.dispensers_data.length > 0) {
      html += `
        <tr>
          <td colspan="8" style="padding: 0;">
            <div style="padding: 10px; background-color: #fafafa;">
              <div class="subsection-title">${t("dispenser.data", "Данные ТРК")}:</div>
              <table class="data-table" style="margin: 0;">
                <thead>
                  <tr>
                    <th>${t("dispenser.name", "ТРК")}</th>
                    <th>${t("dispenser.nozzle", "Пистолет")}</th>
                    <th class="text-right">${t("dispenser.shift_volume", "Объём за смену (л)")}</th>
                    <th class="text-right">${t("dispenser.shift_amount", "Сумма за смену")}</th>
                    <th class="text-right">${t("dispenser.total_volume", "Общий объём (л)")}</th>
                    <th class="text-right">${t("dispenser.calc_volume", "Расчётный объём (л)")}</th>
                  </tr>
                </thead>
                <tbody>
      `;

      for (const dispenser of tank.dispensers_data) {
        html += `
          <tr>
            <td>${dispenser.dispenser_name}</td>
            <td class="text-center">${dispenser.nozzle_addres}</td>
            <td class="text-right">${dispenser.shift_volume.toFixed(2)}</td>
            <td class="text-right">${dispenser.shift_amount.toFixed(2)}</td>
            <td class="text-right">${dispenser.total_volume.toFixed(2)}</td>
            <td class="text-right">${dispenser.calc_volume.toFixed(2)}</td>
          </tr>
        `;
      }

      html += `
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      `;
    }
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/**
 * Генерация секции разницы в объёмах
 */
function generateVolumeDifferenceSection(
  t: TFunction,
  dataOpen: ShiftData[],
  dataClose: ShiftData[]
): string {
  let html = `
    <div class="detail-section">
      <div class="detail-header">${t("shift.volume_difference", "Изменение объёмов за смену")}</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="text-center">${t("tank.number", "№")}</th>
            <th>${t("tank.product", "Продукт")}</th>
            <th class="text-right">${t("shift.volume_start", "Объём начало (л)")}</th>
            <th class="text-right">${t("shift.volume_end", "Объём конец (л)")}</th>
            <th class="text-right">${t("shift.volume_diff", "Разница (л)")}</th>
            <th class="text-right">${t("shift.dispensed", "Отпущено по ТРК (л)")}</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const tankOpen of dataOpen) {
    const tankClose = dataClose.find(t => t.number === tankOpen.number);
    if (tankClose) {
      const diff = tankOpen.volume_current - tankClose.volume_current;

      // Считаем общий объём отпущенного топлива по ТРК
      let totalDispensed = 0;
      if (tankClose.dispensers_data) {
        totalDispensed = tankClose.dispensers_data.reduce(
          (sum, d) => sum + d.shift_volume,
          0
        );
      }

      html += `
        <tr>
          <td class="text-center">${tankOpen.number}</td>
          <td>${tankOpen.gas}</td>
          <td class="text-right">${tankOpen.volume_current.toFixed(2)}</td>
          <td class="text-right">${tankClose.volume_current.toFixed(2)}</td>
          <td class="text-right" style="font-weight: bold; color: ${diff < 0 ? '#ef4444' : '#22c55e'};">
            ${diff > 0 ? '+' : ''}${diff.toFixed(2)}
          </td>
          <td class="text-right">${totalDispensed.toFixed(2)}</td>
        </tr>
      `;
    }
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/**
 * Колонки для печати смен
 */
export function getShiftPrintColumns(t: TFunction): PrintColumnConfig<ShiftEntity>[] {
  return [
    {
      key: "id",
      header: t("shift.columns.id", "ID"),
      width: "10%",
      align: "center",
      formatter: (value) => value ? `#${String(value).slice(-8)}` : "",
    },
    {
      key: "d_open",
      header: t("shift.columns.opened_at", "Открыта"),
      width: "20%",
      formatter: (value) => value ? format(new Date(value), "dd.MM.yyyy HH:mm") : "",
    },
    {
      key: "d_close",
      header: t("shift.columns.closed_at", "Закрыта"),
      width: "20%",
      formatter: (value) => value ? format(new Date(value), "dd.MM.yyyy HH:mm") : "-",
    },
    {
      key: "user_open.full_name",
      header: t("shift.columns.opened_by", "Открыл"),
      width: "25%",
    },
    {
      key: "user_close.full_name",
      header: t("shift.columns.closed_by", "Закрыл"),
      width: "25%",
      formatter: (value) => value || "-",
    },
  ];
}

/**
 * Конфигурация печати данных смены (ShiftData)
 */
export function createShiftDataPrintConfig(
  t: TFunction,
  title: string
): PrintConfig<ShiftData> {
  return {
    title,
    columns: [
      {
        key: "number",
        header: t("shift_data.tank_number", "№ резервуара"),
        width: "8%",
        align: "center",
      },
      {
        key: "gas",
        header: t("shift_data.product", "Продукт"),
        width: "15%",
      },
      {
        key: "temperature",
        header: t("shift_data.temperature", "Темп. (°C)"),
        width: "10%",
        align: "right",
        formatter: (value) => value?.toFixed(1) || "0.0",
      },
      {
        key: "density",
        header: t("shift_data.density", "Плотность"),
        width: "10%",
        align: "right",
        formatter: (value) => value?.toFixed(3) || "0.000",
      },
      {
        key: "volume_current",
        header: t("shift_data.volume", "Объём (л)"),
        width: "12%",
        align: "right",
        formatter: (value) => value?.toFixed(2) || "0.00",
      },
      {
        key: "level_current",
        header: t("shift_data.level", "Уровень (мм)"),
        width: "12%",
        align: "right",
        formatter: (value) => value?.toFixed(2) || "0.00",
      },
    ],
    orientation: "landscape",
    showFooter: true,
  };
}
