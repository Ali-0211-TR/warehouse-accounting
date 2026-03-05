import { useOrderMovementStore } from "@/entities/order/model/order-movement-store";
import { initOrderFilter } from "@/entities/order/model/schemas";
import { useProductStore } from "@/entities/product";
import { OrderReportFilters } from "@/features/order";
import { MovementReportDataActions } from "@/features/order/ui/MovementReportDataAction";
import { OrderReportList } from "@/features/order/ui/order-report-list";
import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { OrderTypeBreakdown } from "@/shared/ui/components/OrderTypeBreakdown";
import { useReportDateFilter } from "@/shared/hooks/use-report-date-filter";
import { Button } from "@/shared/ui/shadcn/button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Filter } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { OrderEntity } from "@/entities/order/model/types";

export const MovementsReportPage = React.memo(() => {
  const { t } = useTranslation();
  const { orders, loading, clearFilter, pageChange, sortData, loadData, query, loadAllForExport } =
    useOrderMovementStore();
  const loadProducts = useProductStore((s) => s.loadProducts);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // ── Client-side filters (product / group — not supported by backend) ──
  const [productFilter, setProductFilter] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const handleDateRange = useCallback(
    async (dateRange: [string, string]) => {
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

  const { selectedShift, handleShiftSelect } = useReportDateFilter({
    onDateRangeResolved: handleDateRange,
  });

  const onShiftSelect = useCallback(
    async (shift: Parameters<typeof handleShiftSelect>[0]) => {
      const range = await handleShiftSelect(shift);
      if (range) {
        await loadData({
          filters: { ...initOrderFilter, d_move: range },
        });
      } else {
        await clearFilter();
      }
    },
    [handleShiftSelect, loadData, clearFilter],
  );

  // ── Detect active backend filters ──
  const hasActiveFilters = useMemo(() => {
    const f = query.filters;
    const backendActive = !!(f.id || f.client_id || f.company || f.order_type);
    return backendActive || !!productFilter || !!groupFilter;
  }, [query.filters, productFilter, groupFilter]);

  // ── Client-side filtering by product / group ──
  const filteredOrders = useMemo(() => {
    let items: OrderEntity[] = orders.items;

    if (productFilter) {
      items = items.filter((o) =>
        o.items.some((item) => item.product?.id === productFilter),
      );
    }

    if (groupFilter) {
      items = items.filter((o) =>
        o.items.some((item) => item.product?.group?.id === groupFilter),
      );
    }

    return items;
  }, [orders.items, productFilter, groupFilter]);

  // ── Handle extended filters (backend + client-side) ──
  const handleFiltersApply = useCallback(() => {
    setFiltersVisible(false);
  }, []);

  const handleFiltersClear = useCallback(() => {
    setProductFilter(null);
    setGroupFilter(null);
  }, []);

  const meta = orders.meta;
  const totalsByType = meta.totalsByType;

  // ── Count of active filter chips ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    const f = query.filters;
    if (f.id) count++;
    if (f.client_id) count++;
    if (f.company) count++;
    if (f.order_type) count++;
    if (productFilter) count++;
    if (groupFilter) count++;
    return count;
  }, [query.filters, productFilter, groupFilter]);

  return (
    <ReportLayout
      title="menu.report.product_movements"
      showShiftSelector
      selectedShift={selectedShift}
      onShiftSelect={onShiftSelect}
      headerActions={
        <div className="flex items-center gap-2">
          <MovementReportDataActions
            data={orders.items}
            disabled={orders.items.length === 0}
            loadAllData={loadAllForExport}
            totalCount={orders.count}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersVisible(true)}
            className={hasActiveFilters
              ? "border-primary text-primary hover:bg-primary/10"
              : ""
            }
          >
            <Filter className="h-4 w-4 mr-1" />
            {t("control.filters")}
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      }
    >
      {/* Detailed Breakdown by Order Type */}
      <OrderTypeBreakdown
        totalsByType={totalsByType}
        showDescriptions
        className="mb-2"
      />

      {/* Orders Table */}
      <OrderReportList
        orders={filteredOrders}
        loading={loading}
        pagination={{ ...orders }}
        onPageChange={pageChange}
        onSort={sortData}
        selectable={true}
      />

      {/* Filters Dialog */}
      <OrderReportFilters
        open={filtersVisible}
        onClose={handleFiltersApply}
        productFilter={productFilter}
        onProductFilterChange={setProductFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        onClientFiltersClear={handleFiltersClear}
      />
    </ReportLayout>
  );
});

MovementsReportPage.displayName = "MovementsReportPage";
