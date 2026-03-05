import { dispenserApi } from "@/entities/dispenser/api/dispenser-api";
import { useShiftStore } from "@/entities/shift/model/store";
import { useDispenser } from "@/features/dispenser";
import { useDateFilter } from "@/features/shift/model/use-date-filter";
import { NozzleSummaryData } from "@/shared/bindings/NozzleSummaryData";
import { useToast } from "@/shared/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

// ─── Filter Schema ───────────────────────────────────────────
export const filtersSchema = z.object({
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .nullable()
    .optional(),
  dispenserFilter: z.string().optional(),
  tankFilter: z.string().optional(),
  searchTerm: z.string().optional(),
  shiftFilter: z.string().optional(),
});

export type FiltersFormValues = z.infer<typeof filtersSchema>;

// ─── Interfaces ──────────────────────────────────────────────
export interface FuelMovement {
  id: string;
  dispenserName: string;
  nozzleId: string;
  nozzleAddress: number;
  fuelType: string;
  tank: string;
  totalVolume: number | null;
  totalAmount: number | null;
  shiftVolume: number | null;
  shiftAmount: number | null;
  foVolume: number;
  foAmount: number;
  oiVolume: number;
  oiAmount: number;
  lastUpdated: string;
  status: "online" | "offline";
}

export interface SummaryStats {
  totalShiftVolume: number | null;
  totalShiftAmount: number | null;
  totalRealTimeVolume: number | null;
  totalRealTimeAmount: number | null;
  totalDbVolume: number;
  totalDbAmount: number;
  activeNozzles: number;
  lastUpdateTime: string;
}

export interface TankGroupData {
  tankName: string;
  nozzleCount: number;
  shiftVolume: number | null;
  shiftAmount: number | null;
  totalVolume: number | null;
  totalAmount: number | null;
  dbVolume: number;
  dbAmount: number;
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function addNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return a + b;
}

// ─── Hook ────────────────────────────────────────────────────
export function useFuelMovementsData() {
  const { t } = useTranslation();
  const [movements, setMovements] = useState<FuelMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<FuelMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<Record<string, NozzleSummaryData>>({});
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const {
    dispensers,
    totals,
    getTotalByAddress,
    loadSummaryData,
    getSummaryTotalByNozzleId,
  } = useDispenser();

  const { shifts, loadShifts, currentShift, getCurrentShift, setCurrentShift } =
    useShiftStore();

  const { showErrorToast, showSuccessToast } = useToast();

  // ─── Date filter hook ──────────────────────────────────────
  const dateFilter = useDateFilter({
    initialMode: "shift",
    onShiftChange: (_shift, range) => {
      if (range) {
        form.setValue("dateRange", range);
      } else {
        form.setValue("dateRange", null);
      }
    },
    onDateRangeChange: (range) => {
      form.setValue("dateRange", range);
    },
  });

  // ─── Form ──────────────────────────────────────────────────
  const form = useForm<FiltersFormValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      dateRange: null,
      dispenserFilter: "all",
      tankFilter: "all",
      searchTerm: "",
      shiftFilter: "all",
    },
  });

  const formValues = form.watch();

  // ─── Formatters ────────────────────────────────────────────
  const formatVolume = useCallback((volume: number | null): string => {
    if (volume === null) return "N/A";
    return (volume / 100).toFixed(2);
  }, []);

  const formatDecimal = useCallback((value: number): string => {
    return Number(value).toFixed(2);
  }, []);

  const formatCurrency = useCallback((amount: number | null): string => {
    if (amount === null) return "N/A";
    return Number(amount).toLocaleString();
  }, []);

  // ─── Derived data ─────────────────────────────────────────
  const { uniqueDispensers, uniqueTanks } = useMemo(() => {
    const dispenserSet = new Set<string>();
    const tankSet = new Set<string>();
    movements.forEach((m) => {
      dispenserSet.add(m.dispenserName);
      tankSet.add(m.tank);
    });
    return {
      uniqueDispensers: Array.from(dispenserSet).filter((d) => d?.trim()).sort(),
      uniqueTanks: Array.from(tankSet).filter((t) => t?.trim()).sort(),
    };
  }, [movements]);

  const tankGroupedData = useMemo((): TankGroupData[] => {
    const groups = new Map<string, TankGroupData>();
    filteredMovements.forEach((m) => {
      if (!groups.has(m.tank)) {
        groups.set(m.tank, {
          tankName: m.tank,
          nozzleCount: 0,
          shiftVolume: null,
          shiftAmount: null,
          totalVolume: null,
          totalAmount: null,
          dbVolume: 0,
          dbAmount: 0,
          lastUpdated: m.lastUpdated,
        });
      }
      const g = groups.get(m.tank)!;
      g.nozzleCount += 1;
      g.shiftVolume = addNullable(g.shiftVolume, m.shiftVolume);
      g.shiftAmount = addNullable(g.shiftAmount, m.shiftAmount);
      g.totalVolume = addNullable(g.totalVolume, m.totalVolume);
      g.totalAmount = addNullable(g.totalAmount, m.totalAmount);
      g.dbVolume += m.foVolume;
      g.dbAmount += m.foAmount;
      if (m.lastUpdated > g.lastUpdated) g.lastUpdated = m.lastUpdated;
    });
    return Array.from(groups.values()).sort((a, b) => a.tankName.localeCompare(b.tankName));
  }, [filteredMovements]);

  const summaryStats = useMemo((): SummaryStats => {
    return filteredMovements.reduce<SummaryStats>(
      (acc, m) => ({
        totalShiftVolume: addNullable(acc.totalShiftVolume, m.shiftVolume),
        totalShiftAmount: addNullable(acc.totalShiftAmount, m.shiftAmount),
        totalRealTimeVolume: addNullable(acc.totalRealTimeVolume, m.totalVolume),
        totalRealTimeAmount: addNullable(acc.totalRealTimeAmount, m.totalAmount),
        totalDbVolume: acc.totalDbVolume + m.foVolume,
        totalDbAmount: acc.totalDbAmount + m.foAmount,
        activeNozzles: acc.activeNozzles + (m.status === "online" ? 1 : 0),
        lastUpdateTime: m.lastUpdated > acc.lastUpdateTime ? m.lastUpdated : acc.lastUpdateTime,
      }),
      {
        totalShiftVolume: null,
        totalShiftAmount: null,
        totalRealTimeVolume: null,
        totalRealTimeAmount: null,
        totalDbVolume: 0,
        totalDbAmount: 0,
        activeNozzles: 0,
        lastUpdateTime: "",
      },
    );
  }, [filteredMovements]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      (formValues.dispenserFilter && formValues.dispenserFilter !== "all") ||
      (formValues.tankFilter && formValues.tankFilter !== "all") ||
      (formValues.shiftFilter && formValues.shiftFilter !== "all") ||
      formValues.searchTerm ||
      formValues.dateRange
    );
  }, [formValues.dispenserFilter, formValues.tankFilter, formValues.shiftFilter, formValues.searchTerm, formValues.dateRange]);

  // ─── Load shifts on mount ─────────────────────────────────
  useEffect(() => {
    loadShifts({ sortField: "DOpen", sortOrder: "Desc", first: 0, rows: 50, page: 1 }).catch(console.error);
  }, [loadShifts]);

  // ─── Build movements from dispenser state ─────────────────
  useEffect(() => {
    if (!dispensers?.length) {
      setMovements([]);
      return;
    }

    const data: FuelMovement[] = [];
    dispensers.forEach((dispenser) => {
      dispenser.nozzles?.forEach((nozzle) => {
        if (!nozzle) return;
        try {
          const totalData = getTotalByAddress(nozzle.address);
          const summaryTotalData = getSummaryTotalByNozzleId(nozzle.id || "");
          data.push({
            id: `${dispenser.id}-${nozzle.address}`,
            dispenserName: dispenser.name || "Unknown",
            nozzleId: nozzle.id || "",
            nozzleAddress: nozzle.address || 0,
            fuelType: nozzle.tank?.name || "Unknown",
            tank: nozzle.tank?.name || "Unknown",
            totalVolume: totalData?.totalVolume ?? null,
            totalAmount: totalData?.totalAmount ?? null,
            shiftVolume: totalData?.shiftVolume ?? null,
            shiftAmount: totalData?.shiftAmount ?? null,
            foVolume: summaryTotalData?.fo_volume || 0,
            foAmount: summaryTotalData?.fo_amount || 0,
            oiVolume: summaryTotalData?.oi_volume || 0,
            oiAmount: summaryTotalData?.oi_amount || 0,
            lastUpdated: totalData?.lastUpdated || new Date().toISOString(),
            status: "online" as const,
          });
        } catch (error) {
          console.error("Error processing nozzle data:", error);
        }
      });
    });
    setMovements(data);
  }, [dispensers, totals, getTotalByAddress, getSummaryTotalByNozzleId, summaryData]);

  // ─── Filter movements ─────────────────────────────────────
  useEffect(() => {
    let filtered = [...movements];

    if (formValues.dispenserFilter && formValues.dispenserFilter !== "all") {
      filtered = filtered.filter((m) => m.dispenserName === formValues.dispenserFilter);
    }
    if (formValues.tankFilter && formValues.tankFilter !== "all") {
      filtered = filtered.filter((m) => m.tank === formValues.tankFilter);
    }
    if (formValues.searchTerm) {
      const search = formValues.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.dispenserName.toLowerCase().includes(search) ||
          m.tank.toLowerCase().includes(search) ||
          m.nozzleId.toString().includes(search) ||
          m.nozzleAddress.toString().includes(search),
      );
    }
    if (formValues.dateRange && (formValues.dateRange.from || formValues.dateRange.to)) {
      if (Object.keys(summaryData).length === 0) {
        setFilteredMovements([]);
        return;
      }
      filtered = filtered.filter((m) => !!summaryData[m.nozzleId]);
    }
    setFilteredMovements(filtered);
  }, [movements, summaryData, formValues.dispenserFilter, formValues.tankFilter, formValues.searchTerm, formValues.dateRange]);

  // ─── Load summary data from DB ────────────────────────────
  const loadSummaryTotalsWithDateRange = useCallback(
    async (dateRange: { from?: string; to?: string } | null) => {
      setIsLoadingSummary(true);
      try {
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (dateRange?.from) {
          startDate = dateRange.from.includes(".") ? dateRange.from : `${dateRange.from}.000Z`;
        }
        if (dateRange?.to) {
          endDate = dateRange.to.includes(".") ? dateRange.to : `${dateRange.to}.000Z`;
        }

        const data = await loadSummaryData(startDate, endDate);
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setSummaryData(data as Record<string, NozzleSummaryData>);
        } else {
          console.error("loadSummaryData returned unexpected type:", data);
          setSummaryData({});
        }
        showSuccessToast(t("fuel_movements.summary_loaded", "Summary loaded successfully"));
      } catch (error: any) {
        console.error("Error loading summary data:", error);
        setSummaryData({});
        showErrorToast(
          error.message || t("fuel_movements.failed_to_load_summary", "Failed to load summary"),
        );
      } finally {
        setIsLoadingSummary(false);
      }
    },
    [loadSummaryData, showErrorToast, showSuccessToast, t],
  );

  // ─── Read totals from all dispensers ──────────────────────
  const readAllTotals = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [];
      let commandCount = 0;

      dispensers.forEach((dispenser) => {
        dispenser.nozzles.forEach((nozzle) => {
          promises.push(
            dispenserApi.readTotal(nozzle.address).catch((error) => {
              console.error(`ReadTotal failed for nozzle ${nozzle.address}:`, error);
              throw error;
            }),
          );
          promises.push(
            dispenserApi.readShiftTotal(nozzle.address).catch((error) => {
              console.error(`ReadShiftTotal failed for nozzle ${nozzle.address}:`, error);
              throw error;
            }),
          );
          commandCount += 2;
        });
      });

      const results = await Promise.allSettled(promises);
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        showErrorToast(
          t("fuel_movements.some_commands_failed", "Some commands failed: {{failed}}/{{total}}", {
            failed,
            total: commandCount,
          }),
        );
      } else {
        showSuccessToast(t("fuel_movements.commands_sent", "Commands sent successfully"));
      }
      setLastRefreshTime(new Date());
    } catch (error: any) {
      console.error("Error reading totals:", error);
      showErrorToast(
        error.message || t("fuel_movements.failed_to_read_totals", "Failed to read totals"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispensers, showErrorToast, showSuccessToast, t]);

  // ─── Clear filters ────────────────────────────────────────
  const clearAllFilters = useCallback(() => {
    form.reset({
      dateRange: null,
      dispenserFilter: "all",
      tankFilter: "all",
      searchTerm: "",
      shiftFilter: "all",
    });
    loadSummaryTotalsWithDateRange(null);
  }, [form, loadSummaryTotalsWithDateRange]);

  // ─── Handle filter submit ─────────────────────────────────
  const onSubmitFilters = useCallback(
    (values: FiltersFormValues) => {
      loadSummaryTotalsWithDateRange(values.dateRange || null);
    },
    [loadSummaryTotalsWithDateRange],
  );

  // ─── Export ────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const csvData = filteredMovements.map((m) => ({
      Dispenser: m.dispenserName,
      "Nozzle ID": m.nozzleId,
      "Nozzle Address": m.nozzleAddress,
      Tank: m.tank,
      "Shift Volume (L)": formatVolume(m.shiftVolume),
      "Shift Amount": formatCurrency(m.shiftAmount),
      "Total Volume (L)": formatVolume(m.totalVolume),
      "Total Amount": formatCurrency(m.totalAmount),
      "DB Volume (L)": formatDecimal(m.foVolume),
      "DB Amount": formatCurrency(m.foAmount),
      Status: m.status,
      "Last Updated": m.lastUpdated,
    }));

    if (csvData.length === 0) {
      showErrorToast(t("fuel_movements.no_data_to_export", "No data to export"));
      return;
    }

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((h) => (row as any)[h]).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-movements-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showSuccessToast(t("fuel_movements.export_completed", "Export completed"));
  }, [filteredMovements, formatVolume, formatDecimal, formatCurrency, showSuccessToast, showErrorToast, t]);

  // ─── Initial data load ────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsInitialLoading(true);
      try {
        await readAllTotals();
        await loadSummaryTotalsWithDateRange(null);
        try {
          await getCurrentShift();
          const cs = useShiftStore.getState().currentShift || currentShift;
          if (cs) {
            const range = { from: cs.d_open, to: cs.d_close || new Date().toISOString() };
            dateFilter.handleShiftSelect(cs);
            form.setValue("dateRange", range);
            await loadSummaryTotalsWithDateRange(range);
          }
        } catch {
          // ignore
        }
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Shift select handler (for header selector) ───────────
  const handleHeaderShiftSelect = useCallback(
    async (shift: any) => {
      setCurrentShift(shift ?? null);
      if (!shift) {
        clearAllFilters();
        return;
      }
      const range = { from: shift.d_open, to: shift.d_close || new Date().toISOString() };
      dateFilter.handleShiftSelect(shift);
      form.setValue("dateRange", range);
      await loadSummaryTotalsWithDateRange(range);
    },
    [setCurrentShift, clearAllFilters, dateFilter, form, loadSummaryTotalsWithDateRange],
  );

  return {
    // State
    movements,
    filteredMovements,
    isLoading,
    isLoadingSummary,
    isInitialLoading,
    lastRefreshTime,

    // Derived data
    summaryStats,
    tankGroupedData,
    uniqueDispensers,
    uniqueTanks,
    hasActiveFilters,

    // Shift
    currentShift,
    shifts,

    // Form
    form,
    dateFilter,

    // Formatters
    formatVolume,
    formatDecimal,
    formatCurrency,

    // Actions
    readAllTotals,
    handleExport,
    clearAllFilters,
    onSubmitFilters,
    handleHeaderShiftSelect,
  };
}
