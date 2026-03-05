import { OrderItemEntity } from "@/entities/order";
import { useDispenser } from "@/features/dispenser";
import { FuelOrderFilters, FuelSaleDataActions, useFuelingOrder } from "@/features/fueling-order";
import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { useReportDateFilter } from "@/shared/hooks/use-report-date-filter";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { format } from "date-fns";
import { Filter, Truck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export function FuelSaleReportPage() {
  const { t } = useTranslation();
  const [filtersVisible, setFiltersVisible] = useState(false);

  const {
    fuelingOrderitems,
    loading,
    pageChange,
    onSort,
    hasActiveFilters,
    onShowFilters,
    onHideFilters,
    setFilters,
    clearFilter,
    loadAllForExport,
  } = useFuelingOrder();

  const { dispensers } = useDispenser();

  const handleDateRange = useCallback(
    async (dateRange: [string, string]) => {
      await setFilters?.({ d_move: dateRange });
    },
    [setFilters],
  );

  const { selectedShift, handleShiftSelect } = useReportDateFilter({
    onDateRangeResolved: handleDateRange,
  });

  const onShiftSelect = useCallback(
    async (shift: Parameters<typeof handleShiftSelect>[0]) => {
      const range = await handleShiftSelect(shift);
      if (range) {
        await setFilters?.({ d_move: range });
      } else {
        await clearFilter?.();
      }
    },
    [handleShiftSelect, setFilters, clearFilter],
  );

  const formatDateTime = useCallback((dateTime: string) => {
    try {
      return format(new Date(dateTime), "dd.MM.yyyy HH:mm");
    } catch {
      return dateTime;
    }
  }, []);

  const getNozzle = (nozzleId: string): string => {
    for (const dispenser of dispensers) {
      const nozzle = dispenser.nozzles.find((n) => n.id === nozzleId);
      if (nozzle && nozzle.tank?.name) {
        return `${dispenser.name} - ${nozzle.tank?.name || "Tank"} (${nozzle.address})`;
      }
    }
    return "";
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: t("fueling_order.title"),
        accessor: (orderItem: OrderItemEntity) => orderItem.product?.name,
        render: (orderItem: OrderItemEntity) => (
          <div className="flex items-center space-x-3">
            <div className="space-y-1">
              <div className="font-medium">{orderItem.product?.name}</div>
              {orderItem.product?.short_name && (
                <div className="text-sm text-muted-foreground">
                  {orderItem.product?.short_name}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "volume",
        header: t("fueling_order.volume"),
        accessor: (orderItem: OrderItemEntity) => orderItem.fueling_order?.volume,
        width: "w-28",
        align: "right" as const,
        render: (orderItem: OrderItemEntity) => (
          <div className="text-right font-mono">
            {parseFloat(orderItem.fueling_order?.volume?.toString() || "0").toFixed(2)} L
          </div>
        ),
      },
      {
        key: "amount",
        header: t("fueling_order.amount"),
        accessor: (orderItem: OrderItemEntity) => orderItem.fueling_order?.amount,
        width: "w-32",
        align: "right" as const,
        render: (orderItem: OrderItemEntity) => (
          <div className="text-right font-mono font-semibold text-green-600">
            {parseFloat(orderItem.fueling_order?.amount?.toString() || "0").toFixed(2)} so'm
          </div>
        ),
      },
      {
        key: "d_move",
        header: t("fueling_order.d_move"),
        accessor: (orderItem: OrderItemEntity) => orderItem.fueling_order?.d_move || "",
        width: "w-40",
        sortable: true,
        render: (orderItem: OrderItemEntity) =>
          orderItem.fueling_order?.d_move ? (
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formatDateTime(orderItem.fueling_order?.d_move)}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "nozzle_id",
        header: t("fueling_order.nozzle_id"),
        accessor: (orderItem: OrderItemEntity) => orderItem.fueling_order?.nozzle_id,
        render: (orderItem: OrderItemEntity) => (
          <div className="flex">{getNozzle(orderItem.fueling_order?.nozzle_id ?? "")}</div>
        ),
      },
    ],
    [t, formatDateTime, getNozzle],
  );

  const summaryData = useMemo(() => {
    if (!fuelingOrderitems) return [];

    const formatDecimal = (value: any): string => {
      try {
        const numValue = parseFloat(value?.toString() || "0");
        return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
      } catch {
        return "0.00";
      }
    };

    return [
      {
        label: t("fueling_order.count"),
        value: fuelingOrderitems.count?.toString() || "0",
        className: "text-orange-600",
        render: () => <span className="font-mono">{fuelingOrderitems.count || 0}</span>,
      },
      {
        label: t("fueling_order.total_volume"),
        value: fuelingOrderitems.meta.totalVolume?.toString() || "0",
        className: "text-blue-600",
        render: () => (
          <span className="font-mono">{formatDecimal(fuelingOrderitems.meta.totalVolume)} L</span>
        ),
      },
      {
        label: t("fueling_order.total_amount"),
        value: fuelingOrderitems.meta.totalAmount?.toString() || "0",
        className: "text-green-600",
        render: () => (
          <span className="font-mono">{formatDecimal(fuelingOrderitems.meta.totalAmount)} so'm</span>
        ),
      },
    ];
  }, [fuelingOrderitems, t]);

  const filterButton = (
    <div className="flex items-center gap-2">
      <FuelSaleDataActions
        data={fuelingOrderitems?.items || []}
        disabled={loading || !fuelingOrderitems?.items?.length}
        loadAllData={loadAllForExport}
        totalCount={fuelingOrderitems?.count ?? 0}
      />
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setFiltersVisible(true);
          onShowFilters();
        }}
      >
        <Filter className="h-4 w-4 mr-2" />
        {t("control.filters")}
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2">!</Badge>
        )}
      </Button>
    </div>
  );

  return (
    <ReportLayout
      title="menu.report.fuel_sale"
      showShiftSelector
      selectedShift={selectedShift}
      onShiftSelect={onShiftSelect}
      headerActions={filterButton}
    >
      {fuelingOrderitems && (
        <>
          {/* Desktop / Tablet */}
          <div className="hidden sm:block">
            <ServerEntityTable
              data={fuelingOrderitems?.items || []}
              columns={columns}
              loading={loading}
              onSort={onSort}
              emptyMessage="message.no_data"
              pageIndex={(fuelingOrderitems?.page ?? 1) - 1}
              pageCount={fuelingOrderitems?.pageCount ?? 0}
              canPreviousPage={(fuelingOrderitems?.page ?? 1) > 1}
              canNextPage={(fuelingOrderitems?.page ?? 1) < (fuelingOrderitems?.pageCount ?? 0)}
              onPreviousPage={() => pageChange((fuelingOrderitems?.page ?? 1) - 1)}
              onNextPage={() => pageChange((fuelingOrderitems?.page ?? 1) + 1)}
              onGoToPage={(pageIndex0) => pageChange(pageIndex0 + 1)}
              totalCount={fuelingOrderitems?.count ?? 0}
              summaryData={summaryData}
              summaryPosition="top"
            />
          </div>

          {/* Mobile cards */}
          <div className="block sm:hidden">
            <div className="space-y-3">
              <div className="bg-background border rounded-lg p-3">
                <div className="flex flex-wrap gap-2">
                  {summaryData.map((s) => (
                    <div key={s.label} className="flex-1 min-w-[120px]">
                      <div className="text-sm text-muted-foreground">{s.label}</div>
                      <div>{s.render ? s.render() : s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {fuelingOrderitems.items.map((item) => (
                <div key={item.id} className="bg-background border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="pr-2">
                      <div className="font-medium">{item.product?.name}</div>
                      {item.product?.short_name && (
                        <div className="text-sm text-muted-foreground">{item.product?.short_name}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-green-600">
                        {parseFloat(item.fueling_order?.amount?.toString() || "0").toFixed(2)} so'm
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {parseFloat(item.fueling_order?.volume?.toString() || "0").toFixed(2)} L
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>{item.fueling_order?.d_move ? formatDateTime(item.fueling_order.d_move) : "—"}</div>
                    <div className="mt-1">{getNozzle(item.fueling_order?.nozzle_id ?? "")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <FuelOrderFilters
        open={filtersVisible}
        onClose={() => {
          setFiltersVisible(false);
          onHideFilters();
        }}
      />
    </ReportLayout>
  );
}
