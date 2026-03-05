import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DataActions } from "@/shared/ui/components/DataActions";
import type { SummaryReportData } from "@/entities/order";
import { createSummaryReportPrintConfig } from "@/entities/order";
import { exportSummaryReportToExcel } from "@/entities/order/lib/export/export-summary-excel";
import useToast from "@/shared/hooks/use-toast";
import type { ExportFormat } from "@/shared/lib/export";
import { saveFile } from "@/shared/lib/file-helpers";
import { openPrintWindow } from "@/shared/lib/print";
import { format as formatDate } from "date-fns";

interface SummaryReportDataActionsProps {
  data: SummaryReportData;
  disabled?: boolean;
  className?: string;
}

export function SummaryReportDataActions({
  data,
  disabled = false,
  className,
}: SummaryReportDataActionsProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!data || data.products.length === 0) {
        showErrorToast(t("order.no_data_to_export", "Нет данных для экспорта"));
        return;
      }

      try {
        if (format === "xlsx" || format === "xls") {
          const blob = exportSummaryReportToExcel(data, t);
          const filename = `summary_report_${formatDate(new Date(), "yyyy-MM-dd")}.xlsx`;
          await saveFile(blob, filename);
        } else {
          showErrorToast(
            t("export.format_not_supported", "Формат {{format}} не поддерживается для этого отчёта", { format }),
          );
          return;
        }

        showSuccessToast(t("export.success", "Экспортировано успешно"));
      } catch (error) {
        console.error("Export error:", error);
        showErrorToast(t("export.error", "Ошибка экспорта"));
      }
    },
    [data, t, showSuccessToast, showErrorToast],
  );

  const handlePrint = useCallback(async () => {
    if (!data || data.products.length === 0) {
      showErrorToast(t("print.no_data", "Нет данных для печати"));
      return;
    }

    try {
      const config = createSummaryReportPrintConfig(t, data);
      await openPrintWindow([], config);
    } catch (error) {
      console.error("Print error:", error);
      showErrorToast(t("print.error", "Ошибка печати"));
    }
  }, [data, t, showErrorToast]);

  return (
    <DataActions
      onExport={handleExport}
      onPrint={handlePrint}
      exportDisabled={disabled || !data || data.products.length === 0}
      printDisabled={disabled || !data || data.products.length === 0}
      className={className}
    />
  );
}
