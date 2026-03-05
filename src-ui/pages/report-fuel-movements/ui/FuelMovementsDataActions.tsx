import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { DataActions } from "@/shared/ui/components/DataActions";
import useToast from "@/shared/hooks/use-toast";
import type { ExportFormat, ExportConfig } from "@/shared/lib/export";
import { exportData } from "@/shared/lib/export";
import { openPrintWindow } from "@/shared/lib/print";
import type { PrintConfig } from "@/shared/lib/print";
import { format as formatDate } from "date-fns";
import type { FuelMovement } from "../model/use-fuel-movements-data";

interface FuelMovementsDataActionsProps {
  data: FuelMovement[];
  disabled?: boolean;
  className?: string;
  formatVolume: (v: number | null) => string;
  formatCurrency: (v: number | null) => string;
}

function createFuelMovementsExportConfig(
  t: TFunction,
  formatVolume: (v: number | null) => string,
  formatCurrency: (v: number | null) => string,
): ExportConfig<FuelMovement> {
  return {
    filename: `fuel_movements_${formatDate(new Date(), "yyyy-MM-dd")}`,
    title: t("menu.report.fuel_movements", "Движение топлива"),
    orientation: "landscape",
    columns: [
      {
        key: "dispenserName",
        header: t("fuel_movements.dispenser", "ТРК"),
      },
      {
        key: "nozzleAddress",
        header: t("fuel_movements.nozzle_address", "Адрес пистолета"),
        align: "center",
      },
      {
        key: "tank",
        header: t("fuel_movements.tank", "Ёмкость"),
      },
      {
        key: "shiftVolume",
        header: t("fuel_movements.shift_volume", "Объём за смену (L)"),
        align: "right",
        formatter: (_v, row) => formatVolume(row.shiftVolume),
      },
      {
        key: "shiftAmount",
        header: t("fuel_movements.shift_amount", "Сумма за смену"),
        align: "right",
        formatter: (_v, row) => formatCurrency(row.shiftAmount),
      },
      {
        key: "totalVolume",
        header: t("fuel_movements.total_volume", "Общий объём (L)"),
        align: "right",
        formatter: (_v, row) => formatVolume(row.totalVolume),
      },
      {
        key: "totalAmount",
        header: t("fuel_movements.total_amount", "Общая сумма"),
        align: "right",
        formatter: (_v, row) => formatCurrency(row.totalAmount),
      },
      {
        key: "foVolume",
        header: t("fuel_movements.db_volume", "Объём БД (L)"),
        align: "right",
        formatter: (_v, row) => Number(row.foVolume).toFixed(2),
      },
      {
        key: "foAmount",
        header: t("fuel_movements.db_amount", "Сумма БД"),
        align: "right",
        formatter: (_v, row) => formatCurrency(row.foAmount),
      },
      {
        key: "status",
        header: t("fuel_movements.status", "Статус"),
        formatter: (_v, row) => row.status === "online" ? "Online" : "Offline",
      },
    ],
  };
}

function createFuelMovementsPrintConfig(
  t: TFunction,
  formatVolume: (v: number | null) => string,
  formatCurrency: (v: number | null) => string,
): PrintConfig<FuelMovement> {
  return {
    title: t("menu.report.fuel_movements", "Движение топлива"),
    orientation: "landscape",
    columns: [
      {
        key: "dispenserName",
        header: t("fuel_movements.dispenser", "ТРК"),
      },
      {
        key: "nozzleAddress",
        header: t("fuel_movements.nozzle", "Пистолет"),
        align: "center",
        formatter: (_v: unknown, row: FuelMovement) => String(row.nozzleAddress),
      },
      {
        key: "tank",
        header: t("fuel_movements.tank", "Ёмкость"),
      },
      {
        key: "shiftVolume",
        header: t("fuel_movements.shift_volume", "За смену (L)"),
        align: "right",
        formatter: (_v: unknown, row: FuelMovement) => formatVolume(row.shiftVolume),
      },
      {
        key: "shiftAmount",
        header: t("fuel_movements.shift_amount", "Сумма"),
        align: "right",
        formatter: (_v: unknown, row: FuelMovement) => formatCurrency(row.shiftAmount),
      },
      {
        key: "foVolume",
        header: t("fuel_movements.db_volume", "БД (L)"),
        align: "right",
        formatter: (_v: unknown, row: FuelMovement) => Number(row.foVolume).toFixed(2),
      },
      {
        key: "foAmount",
        header: t("fuel_movements.db_amount", "БД сумма"),
        align: "right",
        formatter: (_v: unknown, row: FuelMovement) => formatCurrency(row.foAmount),
      },
    ],
  };
}

export function FuelMovementsDataActions({
  data,
  disabled = false,
  className,
  formatVolume,
  formatCurrency,
}: FuelMovementsDataActionsProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (data.length === 0) {
        showErrorToast(t("fuel_movements.no_data_to_export", "Нет данных для экспорта"));
        return;
      }

      try {
        const config = createFuelMovementsExportConfig(t, formatVolume, formatCurrency);
        const result = await exportData(data, config, format);
        if (result.success) {
          showSuccessToast(t("export.success", "Экспортировано успешно"));
        } else {
          showErrorToast(result.error || t("export.error", "Ошибка экспорта"));
        }
      } catch (error) {
        console.error("Export error:", error);
        showErrorToast(t("export.error", "Ошибка экспорта"));
      }
    },
    [data, t, formatVolume, formatCurrency, showSuccessToast, showErrorToast],
  );

  const handlePrint = useCallback(async () => {
    if (data.length === 0) {
      showErrorToast(t("product.no_data_to_print", "Нет данных для печати"));
      return;
    }

    try {
      const config = createFuelMovementsPrintConfig(t, formatVolume, formatCurrency);
      await openPrintWindow(data, config);
    } catch (error) {
      console.error("Print error:", error);
      showErrorToast(t("print.error", "Ошибка печати"));
    }
  }, [data, t, formatVolume, formatCurrency, showErrorToast]);

  return (
    <DataActions
      onExport={handleExport}
      onPrint={handlePrint}
      exportDisabled={disabled || data.length === 0}
      printDisabled={disabled || data.length === 0}
      exportFormats={['xlsx', 'csv', 'pdf', 'docx']}
      className={className}
    />
  );
}
