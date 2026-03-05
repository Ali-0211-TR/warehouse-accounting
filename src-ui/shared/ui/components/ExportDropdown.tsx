import { Button } from "@/shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import { Download, FileSpreadsheet, FileText, FileJson, FileType } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExportFormat } from "@/shared/lib/export";

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  formats?: ExportFormat[];
  className?: string;
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="h-4 w-4 mr-2" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 mr-2" />,
  xls: <FileSpreadsheet className="h-4 w-4 mr-2" />,
  pdf: <FileType className="h-4 w-4 mr-2" />,
  docx: <FileText className="h-4 w-4 mr-2" />,
  doc: <FileText className="h-4 w-4 mr-2" />,
  json: <FileJson className="h-4 w-4 mr-2" />,
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel (XLSX)',
  xls: 'Excel (XLS)',
  pdf: 'PDF',
  docx: 'Word (DOCX)',
  doc: 'Word (DOC)',
  json: 'JSON',
};

export function ExportDropdown({
  onExport,
  disabled = false,
  loading = false,
  formats = ['xlsx', 'pdf', 'docx'],
  className,
}: ExportDropdownProps) {
  const { t } = useTranslation();

  const handleExport = async (format: ExportFormat) => {
    try {
      await onExport(format);
    } catch (error) {
      console.error('ExportDropdown: Export failed for', format, error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {t("common.export", "Экспорт")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
          >
            {FORMAT_ICONS[format]}
            {FORMAT_LABELS[format]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
