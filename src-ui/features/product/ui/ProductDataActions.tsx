import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DataActions } from "@/shared/ui/components/DataActions";
import {
  exportProductsToWord,
  exportProductsToExcel,
  exportProductsToPDF,
  createProductPrintConfig,
} from "@/entities/product";
import type { ProductEntity } from "@/entities/product";
import useToast from "@/shared/hooks/use-toast";
import type { ExportFormat } from "@/shared/lib/export";
import { openPrintWindow } from "@/shared/lib/print";
import { format as formatDate } from "date-fns";
import { saveFile } from "@/shared/lib/file-helpers";

interface ProductDataActionsProps {
  data: ProductEntity[];
  disabled?: boolean;
  className?: string;
}

export function ProductDataActions({
  data,
  disabled = false,
  className,
}: ProductDataActionsProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (data.length === 0) {
        showErrorToast(t("product.no_data_to_export", "Нет данных для экспорта"));
        return;
      }

      try {
        // Для PDF используем специальный экспортер
        if (format === "pdf") {
          const blob = await exportProductsToPDF(data, t);
          await saveFile(
            blob,
            `products_balance_${formatDate(new Date(), "yyyy-MM-dd")}.pdf`
          );
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        // Для Word используем специальный экспортер
        if (format === "docx" || format === "doc") {
          const blob = await exportProductsToWord(data, t);
          await saveFile(
            blob,
            `products_balance_${formatDate(new Date(), "yyyy-MM-dd")}.docx`
          );
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        // Для Excel используем специальный экспортер
        if (format === "xlsx" || format === "xls") {
          const blob = exportProductsToExcel(data, t);
          await saveFile(
            blob,
            `products_balance_${formatDate(new Date(), "yyyy-MM-dd")}.xlsx`
          );
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        showErrorToast(
          t("export.error", "Ошибка не поддерживаемый формат экспорта")
        );
      } catch (error) {
        console.error("Export error:", error);
        showErrorToast(t("export.error", "Ошибка экспорта"));
      }
    },
    [data, t, showSuccessToast, showErrorToast]
  );

  const handlePrint = useCallback(
    async () => {
      if (data.length === 0) {
        showErrorToast(t("product.no_data_to_print", "Нет данных для печати"));
        return;
      }

      try {
        const config = createProductPrintConfig(t);
        await openPrintWindow(data, config);
      } catch (error) {
        console.error("Print error:", error);
        showErrorToast(t("print.error", "Ошибка печати"));
      }
    },
    [data, t, showErrorToast]
  );

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
