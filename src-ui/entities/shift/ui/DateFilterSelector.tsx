import { ShiftEntity, ShiftSelector } from "@/entities/shift";
import { DateRangePicker } from "@/shared/ui/components/DateRatePicker";
import { Label } from "@/shared/ui/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/shadcn/radio-group";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export type DateFilterMode = "shift" | "range";

export interface DateRange {
  from?: string;
  to?: string;  // Сделаем to опциональным
}

interface DateFilterSelectorProps {
  mode: DateFilterMode;
  onModeChange: (mode: DateFilterMode) => void;

  // Shift mode props
  selectedShift?: ShiftEntity | null;
  onShiftSelect?: (shift: ShiftEntity | null) => void;
  shifts?: ShiftEntity[];

  // Range mode props
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;

  // Optional labels
  labelText?: string;
  shiftModeLabel?: string;
  rangeModeLabel?: string;
  shiftLabel?: string;
  dateRangeLabel?: string;
  shiftPlaceholder?: string;
  dateRangePlaceholder?: string;
  dateFormat?: string;
}

export function DateFilterSelector({
  mode,
  onModeChange,

  selectedShift,
  onShiftSelect,
  shifts: _shifts = [],

  dateRange,
  onDateRangeChange,

  labelText,
  shiftModeLabel,
  rangeModeLabel,
  shiftLabel,
  dateRangeLabel,
  shiftPlaceholder,
  dateRangePlaceholder,
  dateFormat = "yyyy-MM-dd",
}: DateFilterSelectorProps) {
  const { t } = useTranslation();

  const handleModeChange = useCallback(
    (newMode: DateFilterMode) => {
      onModeChange(newMode);
    },
    [onModeChange]
  );

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="space-y-3 pt-2 border-t">
        <Label className="text-sm font-medium">
          {labelText || t("order.date_filter_by", "Фильтр по дате")}
        </Label>
        <RadioGroup
          value={mode}
          onValueChange={value => handleModeChange(value as DateFilterMode)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="shift" id="date-filter-mode-shift" />
            <Label
              htmlFor="date-filter-mode-shift"
              className="font-normal cursor-pointer"
            >
              {shiftModeLabel || t("order.by_shift", "По смене")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="range" id="date-filter-mode-range" />
            <Label
              htmlFor="date-filter-mode-range"
              className="font-normal cursor-pointer"
            >
              {rangeModeLabel || t("order.by_period", "По периоду")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Shift Selector - shown only when mode is 'shift' */}
      {mode === "shift" && onShiftSelect && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {shiftLabel || t("order.shift", "Смена")}
          </Label>
          <ShiftSelector
            value={selectedShift || null}
            onSelect={onShiftSelect}
            placeholder={
              shiftPlaceholder || t("order.select_shift", "Выберите смену")
            }
          />
        </div>
      )}

      {/* Date Range Picker - shown only when mode is 'range' */}
      {mode === "range" && onDateRangeChange && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {dateRangeLabel || t("order.date_range", "Период")}
          </Label>
          <DateRangePicker
            value={dateRange || undefined}
            onChange={range => {
              if (!range || (
                dateRange &&
                dateRange.from &&
                dateRange.to
              )) {
                onDateRangeChange(undefined);
                return;
              }
              if (range) {
                onDateRangeChange(range);
              }
            }}
            placeholder={
              dateRangePlaceholder ||
              t("order.select_date_range", "Выберите период")
            }
            dateFormat={dateFormat}
          />
        </div>
      )}
    </div>
  );
}
