import { useShiftStore } from "@/entities/shift";
import { ShiftEntity } from "@/entities/shift";
import { useCallback, useEffect, useState } from "react";

/**
 * Return type for the useReportDateFilter hook.
 */
export interface UseReportDateFilterReturn {
  /** The currently selected shift (or null) */
  selectedShift: ShiftEntity | null;
  /** Handler for ShiftSelector onSelect — automatically computes date range */
  handleShiftSelect: (shift: ShiftEntity | null) => Promise<[string, string] | null>;
  /** Whether the initial shift load is still in progress */
  initializing: boolean;
}

/**
 * Builds a `[from, to]` date-range tuple from a ShiftEntity.
 * If the shift has no d_close, uses the current time.
 */
export function getShiftDateRange(shift: ShiftEntity): [string, string] {
  const dClose = shift.d_close ?? new Date().toISOString();
  return [shift.d_open, dClose];
}

/**
 * Returns a `[from, to]` tuple covering today (00:00 → 23:59).
 */
export function getTodayDateRange(): [string, string] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return [todayStart.toISOString(), todayEnd.toISOString()];
}

interface UseReportDateFilterOptions {
  /**
   * Called with the resolved date range when the component first mounts.
   * Typically used to trigger the initial data load.
   */
  onDateRangeResolved: (dateRange: [string, string]) => Promise<void>;
}

/**
 * Shared hook that standardises the "shift or today" date-filter initialisation
 * across all report pages.
 *
 * On mount it:
 * 1. Tries to load the current shift via `getCurrentShift()`
 * 2. If a shift exists → selects it and calls `onDateRangeResolved` with the shift range
 * 3. Otherwise → falls back to today's date range
 *
 * Also provides `handleShiftSelect` for wiring into `<ShiftSelector onSelect={…}>`.
 */
export function useReportDateFilter({
  onDateRangeResolved,
}: UseReportDateFilterOptions): UseReportDateFilterReturn {
  const { getCurrentShift } = useShiftStore();
  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await getCurrentShift();
      } catch {
        // ignore — we'll still load data
      }

      if (cancelled) return;

      const shift = useShiftStore.getState().currentShift;
      if (shift) {
        setSelectedShift(shift);
        await onDateRangeResolved(getShiftDateRange(shift));
      } else {
        await onDateRangeResolved(getTodayDateRange());
      }

      if (!cancelled) setInitializing(false);
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShiftSelect = useCallback(
    async (shift: ShiftEntity | null): Promise<[string, string] | null> => {
      setSelectedShift(shift);

      if (shift) {
        return getShiftDateRange(shift);
      }

      // Cleared → revert to today
      return getTodayDateRange();
    },
    [],
  );

  return {
    selectedShift,
    handleShiftSelect,
    initializing,
  };
}
