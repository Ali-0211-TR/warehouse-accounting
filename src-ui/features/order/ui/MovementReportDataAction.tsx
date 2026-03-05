import { createProductMovementPrintConfig, exportProductMovementsToExcel, exportProductMovementsToPDF, exportProductMovementsToWord, OrderEntity } from "@/entities/order";
import useToast from "@/shared/hooks/use-toast";
import { ExportFormat } from "@/shared/lib/export";
import { saveFile } from "@/shared/lib/file-helpers";
import { openPrintWindow } from "@/shared/lib/print";
import { DataActions } from "@/shared/ui/components/DataActions";
import { formatDate } from "date-fns";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface MovementReportDataActionsProps {
  data: OrderEntity[];
  disabled?: boolean;
  className?: string;
  loadAllData?: () => Promise<OrderEntity[]>;
  totalCount?: number;
}

export function MovementReportDataActions({
  data,
  disabled = false,
  className,
  loadAllData,
  totalCount,
}: MovementReportDataActionsProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (data.length === 0) {
        showErrorToast(t("order.no_data_to_export", "Нет данных для экспорта"));
        return;
      }
      try {
        // Load ALL data matching filters, not just the current page
        let exportData = data;
        if (loadAllData && totalCount && totalCount > data.length) {
          exportData = await loadAllData();
        }

        if (format === "pdf") {
          const blob = await exportProductMovementsToPDF(exportData, t);
          await saveFile(
            blob,
            `movement_report_${formatDate(new Date(), "yyyy-MM-dd")}.pdf`
          );
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        // Для Word используем специальный экспортер
        if (format === "docx" || format === "doc") {
          const blob = await exportProductMovementsToWord(exportData, t);
          await saveFile(
            blob,
            `movement_report_${formatDate(new Date(), "yyyy-MM-dd")}.docx`
          );
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        // Для Excel используем специальный экспортер
        if (format === "xlsx" || format === "xls") {
          const blob = exportProductMovementsToExcel(exportData, t);
          await saveFile(
            blob,
            `movement_report_${formatDate(new Date(), "yyyy-MM-dd")}.xlsx`
          );
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        showErrorToast(
          t("export.error", "Ошибка не поддерживаемый формат экспорта")
        );
      } catch (error) {
        showErrorToast(t("export.error", "Ошибка экспорта"));
      }
    },
    [data, t, showSuccessToast, showErrorToast, loadAllData, totalCount]
  );
  const handlePrint = useCallback(
    async () => {
      if (data.length === 0) {
        showErrorToast(t("product.no_data_to_print", "Нет данных для печати"));
        return;
      }

      try {
        const config = createProductMovementPrintConfig(data, t);
        await openPrintWindow(data, config);
      } catch (error) {
        console.error("Print error:", error);
        showErrorToast(t("print.error", "Ошибка печати"));
      }
    },
    [data, t, showErrorToast]
  );

  // Здесь будут обработчики экспорта и печати, аналогичные ProductDataActions
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
