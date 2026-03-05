import type { PrintConfig } from "@/shared/lib/print";
import { TFunction } from "i18next";

/**
 * Интерфейс данных движения топлива
 */
export interface FuelMovementData {
  id: string;
  dispenserName: string;
  nozzleId: string;
  nozzleAddress: number;
  fuelType: string;
  tank: string;
  totalVolume: number;
  totalAmount: number;
  shiftVolume: number;
  shiftAmount: number;
  foVolume: number;
  foAmount: number;
  oiVolume: number;
  oiAmount: number;
  lastUpdated: string;
  status: "online" | "offline";
}

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
 * Создаёт конфигурацию печати для отчёта движения топлива
 */
export function createFuelMovementPrintConfig(
  t: TFunction,
  data: FuelMovementData[],
  dateRange?: { from: string; to: string } | null
): PrintConfig<FuelMovementData> {
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

  const customHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <!-- Заголовок -->
      <h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
        ${t("menu.report.fuel_movements", "Отчёт по движению топлива")}
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
          ${t("fuel_movements.summary", "Сводная информация")}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.total_nozzles",
              "Всего сопел"
            )}:</td>
            <td style="padding: 8px; text-align: right;">${data.length}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.total_shift_volume",
              "Объём за смену"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #0284c7; font-weight: bold;">
              ${formatVolume(totals.shiftVolume)} ${t("common.liters", "л")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.total_shift_amount",
              "Сумма за смену"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #0284c7; font-weight: bold;">
              ${formatCurrency(totals.shiftAmount)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.total_volume",
              "Общий объём"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #16a34a; font-weight: bold;">
              ${formatVolume(totals.totalVolume)} ${t("common.liters", "л")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.total_amount",
              "Общая сумма"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #16a34a; font-weight: bold;">
              ${formatCurrency(totals.totalAmount)} ${t("currency.sum", "сум")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.db_volume",
              "Объём БД"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #7c3aed;">
              ${formatVolume(totals.foVolume)} ${t("common.liters", "л")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">${t(
              "fuel_movements.db_amount",
              "Сумма БД"
            )}:</td>
            <td style="padding: 8px; text-align: right; color: #7c3aed;">
              ${formatCurrency(totals.foAmount)} ${t("currency.sum", "сум")}
            </td>
          </tr>
        </table>
      </div>

      <!-- Таблица данных -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 9px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.dispenser",
              "Колонка"
            )}</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.nozzle",
              "Сопло"
            )}</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.tank",
              "Резервуар"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.shift_volume",
              "Объём смены (л)"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.shift_amount",
              "Сумма смены"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.total_volume",
              "Общ. объём (л)"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.total_amount",
              "Общ. сумма"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.db_volume",
              "БД объём (л)"
            )}</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${t(
              "fuel_movements.db_amount",
              "БД сумма"
            )}</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${t(
              "common.status",
              "Статус"
            )}</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (item) => `
            <tr>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${
                item.dispenserName
              }</td>
              <td style="padding: 6px; text-align: center; border: 1px solid #e5e7eb;">${
                item.nozzleAddress
              }</td>
              <td style="padding: 6px; border: 1px solid #e5e7eb;">${
                item.tank
              }</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatVolume(
                item.shiftVolume
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(
                item.shiftAmount
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatVolume(
                item.totalVolume
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(
                item.totalAmount
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatVolume(
                item.foVolume
              )}</td>
              <td style="padding: 6px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(
                item.foAmount
              )}</td>
              <td style="padding: 6px; text-align: center; border: 1px solid #e5e7eb;">
                <span style="color: ${
                  item.status === "online" ? "#16a34a" : "#dc2626"
                };">
                  ${
                    item.status === "online"
                      ? t("common.online", "Онлайн")
                      : t("common.offline", "Оффлайн")
                  }
                </span>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr style="background-color: #f9fafb; font-weight: bold;">
            <td colspan="3" style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">
              ${t("common.total", "Итого")}:
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #0284c7;">
              ${formatVolume(totals.shiftVolume)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #0284c7;">
              ${formatCurrency(totals.shiftAmount)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #16a34a;">
              ${formatVolume(totals.totalVolume)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #16a34a;">
              ${formatCurrency(totals.totalAmount)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #7c3aed;">
              ${formatVolume(totals.foVolume)}
            </td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb; color: #7c3aed;">
              ${formatCurrency(totals.foAmount)}
            </td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return {
    title: t("menu.report.fuel_movements", "Отчёт по движению топлива"),
    pageSize: "A4",
    orientation: "landscape",
    columns: [],
    customHTML,
  };
}
