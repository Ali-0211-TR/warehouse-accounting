import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PrintButton } from "@/shared/ui/components/PrintButton";
import useToast from "@/shared/hooks/use-toast";
import {
  createSummaryReportPrintConfig,
  type SummaryReportData,
} from "@/entities/order";
import { openPrintWindow } from "@/shared/lib/print";

interface SummaryReportPrintButtonProps {
  data: SummaryReportData;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function SummaryReportPrintButton({
  data,
  disabled = false,
  loading = false,
  className,
}: SummaryReportPrintButtonProps) {
  const { t } = useTranslation();
  const { showErrorToast } = useToast();

  const handlePrint = useCallback(async () => {
    if (!data || data.products.length === 0) {
      showErrorToast(t("print.no_data", "Нет данных для печати"));
      return;
    }

    try {
      const config = createSummaryReportPrintConfig(t, data);
      // Передаём пустой массив, так как используем customHTML
      await openPrintWindow([], config);
    } catch (error) {
      console.error("Print error:", error);
      showErrorToast(t("print.error", "Ошибка печати"));
    }
  }, [data, t, showErrorToast]);

  return (
    <PrintButton
      onClick={handlePrint}
      disabled={disabled || !data || data.products.length === 0}
      loading={loading}
      className={className}
    />
  );
}
