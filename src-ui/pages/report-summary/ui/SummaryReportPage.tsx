import { useOrderMovementStore } from "@/entities/order/model/order-movement-store";
import { initOrderFilter } from "@/entities/order/model/schemas";
import {
  getIncomePrice,
  getSalePrice,
  useProductStore,
} from "@/entities/product";
import type { SummaryReportData } from "@/entities/order";
import { SummaryReportDataActions } from "@/features/order";
import { ShiftEntity, useShiftStore } from "@/entities/shift";
import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { OrderTypeBreakdown } from "@/shared/ui/components/OrderTypeBreakdown";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  CalendarDays,
  Loader2,
  RefreshCw,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { SummaryFinancialOverview } from "./SummaryFinancialOverview";
import { SummaryQuickStats } from "./SummaryQuickStats";
import { SummaryCharts } from "./SummaryCharts";
import { SummaryBusinessIntelligence } from "./SummaryBusinessIntelligence";

export const SummaryReportPage = React.memo(() => {
  const { t } = useTranslation();
  const { orders, loading, loadData } = useOrderMovementStore();
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.loadProducts);
  const { getCurrentShift } = useShiftStore();

  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);
  const [dateLabel, setDateLabel] = useState("");

  // ── Load data with an optional date range (null = all time) ──
  const loadWithDateRange = useCallback(
    async (dateRange: [string, string] | null) => {
      await loadData({
        filters: {
          ...initOrderFilter,
          d_move: dateRange,
        },
      });
      loadProducts();
    },
    [loadData, loadProducts],
  );

  // ── Initial load: try current shift, otherwise load ALL data ──
  useEffect(() => {
    const init = async () => {
      try {
        await getCurrentShift();
      } catch {
        // ignore
      }

      const shift = useShiftStore.getState().currentShift;
      if (shift) {
        setSelectedShift(shift);
        const dClose = shift.d_close ?? new Date().toISOString();
        setDateLabel(`${fmtDate(shift.d_open)} — ${fmtDate(dClose)}`);
        await loadWithDateRange([shift.d_open, dClose]);
      } else {
        // No shift → load ALL data (no date filter)
        setDateLabel(t("report.all_time", "За всё время"));
        await loadWithDateRange(null);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shift selection handler ──
  const handleShiftSelect = useCallback(
    async (shift: ShiftEntity | null) => {
      setSelectedShift(shift);

      if (shift) {
        const dClose = shift.d_close ?? new Date().toISOString();
        setDateLabel(`${fmtDate(shift.d_open)} — ${fmtDate(dClose)}`);
        await loadWithDateRange([shift.d_open, dClose]);
      } else {
        // No shift → load ALL data
        setDateLabel(t("report.all_time", "За всё время"));
        await loadWithDateRange(null);
      }
    },
    [loadWithDateRange, t],
  );

  // ── Refresh ──
  const handleRefresh = useCallback(async () => {
    if (selectedShift) {
      const dClose = selectedShift.d_close ?? new Date().toISOString();
      await loadWithDateRange([selectedShift.d_open, dClose]);
    } else {
      await loadWithDateRange(null);
    }
  }, [selectedShift, loadWithDateRange]);

  // ── Derived data ──
  const meta = orders.meta;
  const totalsByType = meta.totalsByType;

  // Inventory snapshot (current state, NOT filtered by period)
  const [totalSaleProduct, totalIncomeProduct] = useMemo(() => {
    return products.reduce(
      (sum, product) => [
        sum[0] + getSalePrice(product) * product.balance,
        sum[1] + getIncomePrice(product) * product.balance,
      ],
      [0, 0],
    );
  }, [products]);

  // Period-filtered order totals
  const totalIncoming = meta.totalIncoming;
  const totalOutgoing = meta.totalOutgoing;
  const netFlow = meta.totalSum;
  const profitMargin = totalIncoming > 0 ? (netFlow / totalIncoming) * 100 : 0;

  // Print data
  const summaryData: SummaryReportData = useMemo(
    () => ({
      totalsByType: orders.meta.totalsByType,
      meta: {
        totalSum: orders.meta.totalSum,
        totalTax: orders.meta.totalTax,
        totalDiscount: orders.meta.totalDiscount,
      },
      ordersCount: orders.count,
      products: products,
    }),
    [orders, products],
  );

  // Period-based order props (filtered by selected shift/date)
  const orderProps = {
    totalIncoming,
    totalOutgoing,
    netFlow,
    profitMargin,
    totalsByType,
  };

  // Inventory snapshot props (always current state)
  const inventoryProps = {
    totalSaleProduct,
    totalIncomeProduct,
    productCount: products.length,
  };

  return (
    <ReportLayout
      title="menu.report.summary"
      showShiftSelector
      selectedShift={selectedShift}
      onShiftSelect={handleShiftSelect}
      headerActions={
        <div className="flex items-center gap-2">
          <SummaryReportDataActions data={summaryData} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      }
    >
      {/* ── Period label ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span>
          {t("report.period", "Период")}: {dateLabel}
        </span>
        <Badge variant="outline" className="ml-auto">
          {orders.count} {t("report.orders_count", "операций")}
        </Badge>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            {t("common.loading", "Загрузка...")}
          </span>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {/* ── Financial Overview + Quick Stats ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <SummaryFinancialOverview
              {...orderProps}
              {...inventoryProps}
            />
            <SummaryQuickStats
              ordersCount={orders.count}
              totalSum={meta.totalSum}
              totalTax={meta.totalTax}
              totalDiscount={meta.totalDiscount}
              {...orderProps}
            />
          </div>

          {/* ── Order Type Breakdown ── */}
          <OrderTypeBreakdown totalsByType={totalsByType} showDescriptions />

          {/* ── Charts ── */}
          <SummaryCharts {...orderProps} {...inventoryProps} />

          {/* ── Business Intelligence ── */}
          <SummaryBusinessIntelligence {...orderProps} {...inventoryProps} />
        </div>
      )}
    </ReportLayout>
  );
});

SummaryReportPage.displayName = "SummaryReportPage";

/* ──────── Helpers ──────── */

function fmtDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd.MM.yyyy HH:mm");
  } catch {
    return dateStr;
  }
}
