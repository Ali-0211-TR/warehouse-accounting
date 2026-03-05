import { ExportDropdown } from "./ExportDropdown";
import { PrintButton } from "./PrintButton";
import type { ExportFormat } from "@/shared/lib/export";

interface DataActionsProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  exportDisabled?: boolean;
  printDisabled?: boolean;
  loading?: boolean;
  exportFormats?: ExportFormat[];
  className?: string;
}

export function DataActions({
  onExport,
  onPrint,
  exportDisabled = false,
  printDisabled = false,
  loading = false,
  exportFormats,
  className,
}: DataActionsProps) {
  const handlePrint = async () => {
    await onPrint();
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <ExportDropdown
        onExport={onExport}
        disabled={exportDisabled}
        loading={loading}
        formats={exportFormats}
      />
      <PrintButton
        onClick={handlePrint}
        disabled={printDisabled}
        loading={loading}
      />
    </div>
  );
}
