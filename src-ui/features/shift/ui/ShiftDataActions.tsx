import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DataActions } from "@/shared/ui/components/DataActions";
import { openPrintWindow } from "@/shared/lib/print";
import { createShiftPrintConfig, createShiftDetailPrintConfig } from "@/entities/shift/lib/print-config";
import { exportShiftToWord, exportShiftToExcel, exportShiftToPDF } from "@/entities/shift/lib/export";
import type { ShiftEntity } from "@/entities/shift";
import { useToast } from "@/shared/hooks/use-toast";
import { format as formatDate } from "date-fns";
import { ExportFormat } from "@/shared/lib/export";
import { saveFile } from "@/shared/lib/file-helpers";

interface ShiftDataActionsProps {
  data: ShiftEntity[];
  disabled?: boolean;
  className?: string;
}

export function ShiftDataActions({
  data,
  disabled = false,
  className,
}: ShiftDataActionsProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      // Если одна смена - используем специальные экспортеры
      if (data.length === 1) {
        const shift = data[0];

        // Для PDF используем специальный экспортер
        if (format === 'pdf') {
          const blob = await exportShiftToPDF(shift, t);
          await saveFile(blob, `shift_detail_${shift.id?.slice(-8)}_${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        // Для Word используем специальный экспортер
        if (format === 'docx' || format === 'doc') {
          const blob = await exportShiftToWord(shift, t);
          await saveFile(blob, `shift_detail_${shift.id?.slice(-8)}_${formatDate(new Date(), 'yyyy-MM-dd')}.docx`);
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }

        // Для Excel используем специальный экспортер
        if (format === 'xlsx' || format === 'xls') {
          const blob = exportShiftToExcel(shift, t);
          await saveFile(blob, `shift_detail_${shift.id?.slice(-8)}_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
          showSuccessToast(t("export.success", "Экспортировано успешно"));
          return;
        }
      }

      showErrorToast(t("export.error", "Ошибка не подерживаемый формат экспорта"));

    } catch (error) {
      console.error('Export error:', error);
      showErrorToast(t("export.error", "Ошибка экспорта"));
    }
  }, [data, t, showSuccessToast, showErrorToast]);

  const handlePrint = useCallback(async () => {
    try {
      // Если одна смена - печатаем детальный отчёт, иначе - список
      const config = data.length === 1
        ? createShiftDetailPrintConfig(t, data[0])
        : createShiftPrintConfig(t);
      await openPrintWindow(data, config);
    } catch (error) {
      console.error('Print error:', error);
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
