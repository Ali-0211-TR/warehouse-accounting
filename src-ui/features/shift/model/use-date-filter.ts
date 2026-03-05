import { ShiftEntity } from "@/entities/shift";
import { useCallback, useState } from "react";

export type DateFilterMode = "shift" | "range";

export interface DateRange {
  from?: string;
  to?: string;  // Сделаем to опциональным
}

interface UseDateFilterProps {
  initialMode?: DateFilterMode;
  onShiftChange?: (shift: ShiftEntity | null, dateRange: DateRange | null) => void;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export function useDateFilter({
  initialMode = "range",
  onShiftChange,
  onDateRangeChange,
}: UseDateFilterProps = {}) {
  const [mode, setMode] = useState<DateFilterMode>(initialMode);
  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleModeChange = useCallback(
    (newMode: DateFilterMode) => {
      setMode(newMode);

      // Clear data when switching modes
      if (newMode === "shift") {
        setDateRange(undefined);
        setSelectedShift(null);
        onDateRangeChange?.(undefined);
      } else {
        setSelectedShift(null);
        onShiftChange?.(null, null);
      }
    },
    [onShiftChange, onDateRangeChange]
  );

  const handleShiftSelect = useCallback(
    (shift: ShiftEntity | null) => {
      setSelectedShift(shift);

      if (!shift) {
        setDateRange(undefined);
        onShiftChange?.(null, null);
        return;
      }

      // Auto-fill date range from shift
      const range: DateRange = {
        from: shift.d_open,
        to: shift.d_close || new Date().toISOString(),
      };

      setDateRange(range);
      onShiftChange?.(shift, range);
    },
    [onShiftChange]
  );

  const handleDateRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      var from = undefined;
      var to = undefined;

      if (range?.from) {
        from = new Date(range.from);
        from.setHours(0,0,0,0);
        from = from.toISOString();
      }
      if (range?.to) {
        to = new Date(range.to);
        to.setHours(23,59,59,999);
        to = to.toISOString();
      }
      setDateRange({from, to});
      onDateRangeChange?.({from, to});
    },
    [onDateRangeChange]
  );

  const reset = useCallback(() => {
    setMode("range");
    setSelectedShift(null);
    setDateRange(undefined);
  }, []);

  return {
    mode,
    selectedShift,
    dateRange,
    handleModeChange,
    handleShiftSelect,
    handleDateRangeSelect,
    reset,
  };
}
