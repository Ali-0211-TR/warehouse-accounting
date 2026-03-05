import { ShiftEntity, ShiftSelector } from "@/entities/shift";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";

interface ReportLayoutProps {
  /** i18n key for the report title */
  title: string;
  /** Optional icon element to display next to the title */
  icon?: ReactNode;
  /** Whether to show the ShiftSelector in the header */
  showShiftSelector?: boolean;
  /** Currently selected shift */
  selectedShift?: ShiftEntity | null;
  /** Callback when shift selection changes */
  onShiftSelect?: (shift: ShiftEntity | null) => void;
  /** Shift selector placeholder text */
  shiftPlaceholder?: string;
  /** Actions to render on the right side of the header (export, print, buttons) */
  headerActions?: ReactNode;
  /** Extra content to render between header title and actions (filters, etc.) */
  headerExtra?: ReactNode;
  /** The main content of the report */
  children: ReactNode;
  /** Additional CSS class for the outer container */
  className?: string;
}

/**
 * Unified layout wrapper for all report pages.
 *
 * Provides a consistent header with:
 * - Report title (left)
 * - Optional ShiftSelector
 * - Action buttons (export/print) on the right
 *
 * Usage:
 * ```tsx
 * <ReportLayout
 *   title="menu.report.summary"
 *   showShiftSelector
 *   selectedShift={shift}
 *   onShiftSelect={handleShiftSelect}
 *   headerActions={<DataActions ... />}
 * >
 *   {content}
 * </ReportLayout>
 * ```
 */
export function ReportLayout({
  title,
  icon,
  showShiftSelector = false,
  selectedShift,
  onShiftSelect,
  shiftPlaceholder,
  headerActions,
  headerExtra,
  children,
  className,
}: ReportLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col gap-3 sm:gap-4 h-full ${className ?? ""}`}>
      {/* ===== Unified Header ===== */}
      <div className="sticky top-0 z-10 bg-background border rounded-lg px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Title + optional extra */}
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <h1 className="text-lg font-semibold truncate">{t(title)}</h1>
            {headerExtra}
          </div>

          {/* Right: ShiftSelector + Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {showShiftSelector && onShiftSelect && (
              <div className="w-full sm:w-auto sm:min-w-[280px]">
                <ShiftSelector
                  value={selectedShift ?? null}
                  onSelect={onShiftSelect}
                  placeholder={
                    shiftPlaceholder ?? t("shift.current_shift", "Текущая смена")
                  }
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>
      </div>

      {/* ===== Report Content ===== */}
      {children}
    </div>
  );
}
