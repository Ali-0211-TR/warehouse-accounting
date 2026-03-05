import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { DataActions } from "@/shared/ui/components/DataActions";
import type { OrderItemEntity } from "@/entities/order";
import useToast from "@/shared/hooks/use-toast";
import type { ExportFormat, ExportConfig } from "@/shared/lib/export";
import { exportData as exportDataToFile } from "@/shared/lib/export";
import { openPrintWindow } from "@/shared/lib/print";
import type { PrintConfig } from "@/shared/lib/print";
import { format as formatDate } from "date-fns";

interface FuelSaleDataActionsProps {
  data: OrderItemEntity[];
  disabled?: boolean;
  className?: string;
  loadAllData?: () => Promise<OrderItemEntity[]>;
  totalCount?: number;
}

function createFuelSaleExportConfig(t: TFunction): ExportConfig<OrderItemEntity> {
  return {
    filename: `fuel_sales_${formatDate(new Date(), "yyyy-MM-dd")}`,
    title: t("menu.report.fuel_sale", "Продажи топлива"),
    orientation: "landscape",
    columns: [
      {
        key: "product_name",
        header: t("fueling_order.title", "Товар"),
        formatter: (_v, row) => row.product?.name || "",
      },
      {
        key: "volume",
        header: t("fueling_order.volume", "Объём (L)"),
        align: "right",
        formatter: (_v, row) =>
          parseFloat(row.fueling_order?.volume?.toString() || "0").toFixed(2),
      },
      {
        key: "amount",
        header: t("fueling_order.amount", "Сумма"),
        align: "right",
        formatter: (_v, row) =>
          parseFloat(row.fueling_order?.amount?.toString() || "0").toFixed(2),
      },
      {
        key: "d_move",
        header: t("fueling_order.d_move", "Дата"),
        formatter: (_v, row) => {
          try {
            return row.fueling_order?.d_move
              ? formatDate(new Date(row.fueling_order.d_move), "dd.MM.yyyy HH:mm")
              : "";
          } catch {
            return row.fueling_order?.d_move || "";
          }
        },
      },
      {
        key: "nozzle_id",
        header: t("fueling_order.nozzle_id", "Пистолет"),
        formatter: (_v, row) => row.fueling_order?.nozzle_id || "",
      },
    ],
  };
}

function createFuelSalePrintConfig(
  t: TFunction,
): PrintConfig<OrderItemEntity> {
  return {
    title: t("menu.report.fuel_sale", "Продажи топлива"),
    columns: [
      {
        key: "product_name",
        header: t("fueling_order.title", "Товар"),
        formatter: (_v: unknown, row: OrderItemEntity) => row.product?.name || "",
      },
      {
        key: "volume",
        header: t("fueling_order.volume", "Объём (L)"),
        align: "right",
        formatter: (_v: unknown, row: OrderItemEntity) =>
          parseFloat(row.fueling_order?.volume?.toString() || "0").toFixed(2),
      },
      {
        key: "amount",
        header: t("fueling_order.amount", "Сумма"),
        align: "right",
        formatter: (_v: unknown, row: OrderItemEntity) =>
          parseFloat(row.fueling_order?.amount?.toString() || "0").toFixed(2),
      },
      {
        key: "d_move",
        header: t("fueling_order.d_move", "Дата"),
        formatter: (_v: unknown, row: OrderItemEntity) => {
          try {
            return row.fueling_order?.d_move
              ? formatDate(new Date(row.fueling_order.d_move), "dd.MM.yyyy HH:mm")
              : "";
          } catch {
            return row.fueling_order?.d_move || "";
          }
        },
      },
    ],
    orientation: "landscape",
  };
}

export function FuelSaleDataActions({
  data,
  disabled = false,
  className,
  loadAllData,
  totalCount,
}: FuelSaleDataActionsProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (data.length === 0) {
        showErrorToast(t("order.no_data_to_export", "Нет данных для экспорта"));
        return;
      }

      try {
        let exportItems = data;
        if (loadAllData && totalCount && totalCount > data.length) {
          exportItems = await loadAllData();
        }

        const config = createFuelSaleExportConfig(t);
        const result = await exportDataToFile(exportItems, config, format);
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
    [data, t, showSuccessToast, showErrorToast, loadAllData, totalCount],
  );

  const handlePrint = useCallback(async () => {
    if (data.length === 0) {
      showErrorToast(t("product.no_data_to_print", "Нет данных для печати"));
      return;
    }

    try {
      const config = createFuelSalePrintConfig(t);
      await openPrintWindow(data, config);
    } catch (error) {
      console.error("Print error:", error);
      showErrorToast(t("print.error", "Ошибка печати"));
    }
  }, [data, t, showErrorToast]);

  return (
    <DataActions
      onExport={handleExport}
      onPrint={handlePrint}
      exportDisabled={disabled || data.length === 0}
      printDisabled={disabled || data.length === 0}
      className={className}
    />
  );
}
