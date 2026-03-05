import { dispenserApi } from "@/entities/dispenser/api/dispenser-api";
import { useDispenser } from "@/features/dispenser";
import { useShiftStore } from "@/entities/shift/model/store";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ReconciliationItem {
  id: string;
  dispenserName: string;
  nozzleAddress: number;
  tank: string;
  trkVolume: number | null;
  trkAmount: number | null;
  dbVolume: number;
  dbAmount: number;
  volumeDiff: number | null;
  amountDiff: number | null;
  status: "match" | "warning" | "critical";
}

export interface ReconciliationSummary {
  totalItems: number;
  matchCount: number;
  warningCount: number;
  criticalCount: number;
  totalTrkVolume: number | null;
  totalDbVolume: number;
  totalTrkAmount: number | null;
  totalDbAmount: number;
}

function getStatus(volumeDiff: number | null): "match" | "warning" | "critical" {
  if (volumeDiff === null) return "warning";
  const abs = Math.abs(volumeDiff);
  if (abs < 1) return "match";
  if (abs < 10) return "warning";
  return "critical";
}

export function useReconciliationData() {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const {
    dispensers,
    totals,
    getTotalByAddress,
    loadSummaryData,
    getSummaryTotalByNozzleId,
  } = useDispenser();

  const { getCurrentShift, setCurrentShift } = useShiftStore();

  const [selectedShift, setSelectedShift] = useState<any>(null);

  // Build reconciliation items
  useEffect(() => {
    if (!dispensers?.length) {
      setItems([]);
      return;
    }

    const data: ReconciliationItem[] = [];
    dispensers.forEach((dispenser) => {
      dispenser.nozzles?.forEach((nozzle) => {
        if (!nozzle) return;
        try {
          const totalData = getTotalByAddress(nozzle.address);
          const summaryTotalData = getSummaryTotalByNozzleId(nozzle.id || "");

          const trkVolume = totalData?.shiftVolume ?? null;
          const trkAmount = totalData?.shiftAmount ?? null;
          const dbVolume = summaryTotalData?.fo_volume || 0;
          const dbAmount = summaryTotalData?.fo_amount || 0;

          const volumeDiff = trkVolume !== null ? (trkVolume / 100) - dbVolume : null;
          const amountDiff = trkAmount !== null ? trkAmount - dbAmount : null;

          data.push({
            id: `${dispenser.id}-${nozzle.address}`,
            dispenserName: dispenser.name || "Unknown",
            nozzleAddress: nozzle.address || 0,
            tank: nozzle.tank?.name || "Unknown",
            trkVolume,
            trkAmount,
            dbVolume,
            dbAmount,
            volumeDiff,
            amountDiff,
            status: getStatus(volumeDiff),
          });
        } catch (error) {
          console.error("Error processing nozzle data:", error);
        }
      });
    });
    setItems(data);
  }, [dispensers, totals, getTotalByAddress, getSummaryTotalByNozzleId]);

  const summary = useMemo((): ReconciliationSummary => {
    return items.reduce<ReconciliationSummary>(
      (acc, item) => ({
        totalItems: acc.totalItems + 1,
        matchCount: acc.matchCount + (item.status === "match" ? 1 : 0),
        warningCount: acc.warningCount + (item.status === "warning" ? 1 : 0),
        criticalCount: acc.criticalCount + (item.status === "critical" ? 1 : 0),
        totalTrkVolume: item.trkVolume !== null
          ? (acc.totalTrkVolume ?? 0) + item.trkVolume
          : acc.totalTrkVolume,
        totalDbVolume: acc.totalDbVolume + item.dbVolume,
        totalTrkAmount: item.trkAmount !== null
          ? (acc.totalTrkAmount ?? 0) + item.trkAmount
          : acc.totalTrkAmount,
        totalDbAmount: acc.totalDbAmount + item.dbAmount,
      }),
      {
        totalItems: 0,
        matchCount: 0,
        warningCount: 0,
        criticalCount: 0,
        totalTrkVolume: null,
        totalDbVolume: 0,
        totalTrkAmount: null,
        totalDbAmount: 0,
      },
    );
  }, [items]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [];
      dispensers.forEach((dispenser) => {
        dispenser.nozzles.forEach((nozzle) => {
          promises.push(dispenserApi.readTotal(nozzle.address).catch(console.error));
          promises.push(dispenserApi.readShiftTotal(nozzle.address).catch(console.error));
        });
      });
      await Promise.allSettled(promises);

      // Also refresh summary data
      if (selectedShift) {
        const startDate = selectedShift.d_open;
        const endDate = selectedShift.d_close || new Date().toISOString();
        await loadSummaryData(startDate, endDate);
      } else {
        await loadSummaryData();
      }

      setLastRefreshTime(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [dispensers, loadSummaryData, selectedShift]);

  const handleShiftSelect = useCallback(
    async (shift: any) => {
      setSelectedShift(shift ?? null);
      setCurrentShift(shift ?? null);
      if (shift) {
        const startDate = shift.d_open;
        const endDate = shift.d_close || new Date().toISOString();
        await loadSummaryData(startDate, endDate);
      } else {
        await loadSummaryData();
      }
    },
    [setCurrentShift, loadSummaryData],
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsInitialLoading(true);
      try {
        await refreshData();
        try {
          await getCurrentShift();
          const cs = useShiftStore.getState().currentShift;
          if (cs) {
            setSelectedShift(cs);
            await loadSummaryData(cs.d_open, cs.d_close || new Date().toISOString());
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

  return {
    items,
    summary,
    isLoading,
    isInitialLoading,
    lastRefreshTime,
    selectedShift,
    handleShiftSelect,
    refreshData,
  };
}
