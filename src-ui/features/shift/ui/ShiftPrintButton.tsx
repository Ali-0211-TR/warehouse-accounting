import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PrintButton } from "@/shared/ui/components/PrintButton";
import { openPrintWindow } from "@/shared/lib/print";
import { createShiftPrintConfig } from "@/entities/shift/lib/print-config";
import type { ShiftEntity } from "@/entities/shift";

interface ShiftPrintButtonProps {
  data: ShiftEntity[];
  disabled?: boolean;
  className?: string;
}

export function ShiftPrintButton({
  data,
  disabled = false,
  className,
}: ShiftPrintButtonProps) {
  const { t } = useTranslation();

  const handlePrint = useCallback(() => {
    const config = createShiftPrintConfig(t);
    openPrintWindow(data, config);
  }, [data, t]);

  return (
    <PrintButton
      onClick={handlePrint}
      disabled={disabled || data.length === 0}
      className={className}
    />
  );
}
