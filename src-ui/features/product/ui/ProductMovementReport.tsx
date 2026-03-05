import { productApi } from "@/entities/product";
import type { ProductMovementFilter } from "@/shared/bindings/dtos/ProductMovementFilter";
import type { ProductMovementItem } from "@/shared/bindings/dtos/ProductMovementItem";
import type { ProductMovementReport as ProductMovementReportType } from "@/shared/bindings/dtos/ProductMovementReport";
import { ShiftEntity, ShiftSelector, useShiftStore } from "@/entities/shift";
import {
  Card,
  CardContent,
} from "@/shared/ui/shadcn/card";
import { Button } from "@/shared/ui/shadcn/button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import { DataActions } from "@/shared/ui/components/DataActions";
import type { ExportFormat, ExportConfig } from "@/shared/lib/export";
import { exportData } from "@/shared/lib/export";
import { openPrintWindow } from "@/shared/lib/print";
import type { PrintConfig } from "@/shared/lib/print";
import useToast from "@/shared/hooks/use-toast";
import { t } from "i18next";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export function ProductMovementReport() {
  const [report, setReport] = useState<ProductMovementReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);
  const { getCurrentShift } = useShiftStore();
  const { showSuccessToast, showErrorToast } = useToast();

  // Search, filter & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [movementFilters, setMovementFilters] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const toggleMovementFilter = useCallback((key: string) => {
    setMovementFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const loadReport = useCallback(async (filter: ProductMovementFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.getProductMovementReport(filter);
      setReport(data);
    } catch (e: any) {
      setError(e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load with current shift or today on mount
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
        await loadReport({
          dateFrom: shift.d_open,
          dateTo: dClose,
          productId: null,
        });
      } else {
        // Fallback to today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        await loadReport({
          dateFrom: todayStart.toISOString(),
          dateTo: todayEnd.toISOString(),
          productId: null,
        });
      }
    };
    init();
  }, [getCurrentShift, loadReport]);

  const formatQty = (value: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd.MM.yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  // Filter out products with zero movement and zero balances
  const activeItems = useMemo(
    () =>
      report?.items.filter(
        (item) =>
          item.startBalance !== 0 ||
          item.incomeQty !== 0 ||
          item.saleQty !== 0 ||
          item.returnsQty !== 0 ||
          item.outcomeQty !== 0 ||
          item.endBalance !== 0
      ) ?? [],
    [report]
  );

  // Search-filtered items
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return activeItems;
    const q = searchQuery.toLowerCase().trim();
    return activeItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        (item.productShortName && item.productShortName.toLowerCase().includes(q))
    );
  }, [activeItems, searchQuery]);

  // Movement type filtered items
  const filteredItems = useMemo(() => {
    if (movementFilters.size === 0) return searchedItems;
    return searchedItems.filter((item) => {
      if (movementFilters.has("sale") && item.saleQty > 0) return true;
      if (movementFilters.has("income") && item.incomeQty > 0) return true;
      if (movementFilters.has("returns") && item.returnsQty > 0) return true;
      if (movementFilters.has("outcome") && item.outcomeQty > 0) return true;
      return false;
    });
  }, [searchedItems, movementFilters]);

  // Reset page when search, filter or report changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, movementFilters, report]);

  // Pagination computed values
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  // Summary totals across ALL filtered items (not just current page)
  const totals = useMemo(
    () =>
      filteredItems.reduce(
        (acc, item) => ({
          startBalance: acc.startBalance + item.startBalance,
          incomeQty: acc.incomeQty + item.incomeQty,
          saleQty: acc.saleQty + item.saleQty,
          returnsQty: acc.returnsQty + item.returnsQty,
          outcomeQty: acc.outcomeQty + item.outcomeQty,
          endBalance: acc.endBalance + item.endBalance,
          diff: acc.diff + item.diff,
        }),
        {
          startBalance: 0,
          incomeQty: 0,
          saleQty: 0,
          returnsQty: 0,
          outcomeQty: 0,
          endBalance: 0,
          diff: 0,
        }
      ),
    [filteredItems]
  );

  const handleExport = useCallback(
    async (fmt: ExportFormat) => {
      if (!filteredItems.length) {
        showErrorToast(t("order.no_data_to_export", "Нет данных для экспорта"));
        return;
      }
      try {
        const config: ExportConfig<ProductMovementItem> = {
          filename: `product_movement_${format(new Date(), "yyyy-MM-dd")}`,
          title: t("product_movement.title", "Движение товаров"),
          orientation: "landscape",
          columns: [
            { key: "productName", header: t("product.name", "Товар") },
            { key: "unitName", header: t("product.unit", "Ед.изм") },
            { key: "startBalance", header: t("product_movement.start_balance", "Нач. остаток"), align: "right", formatter: (v) => formatQty(Number(v)) },
            { key: "incomeQty", header: t("product_movement.income", "Закупка"), align: "right", formatter: (v) => formatQty(Number(v)) },
            { key: "saleQty", header: t("product_movement.sale", "Продажа"), align: "right", formatter: (v) => formatQty(Number(v)) },
            { key: "returnsQty", header: t("product_movement.returns", "Возврат"), align: "right", formatter: (v) => formatQty(Number(v)) },
            { key: "outcomeQty", header: t("product_movement.outcome", "Расход"), align: "right", formatter: (v) => formatQty(Number(v)) },
            { key: "endBalance", header: t("product_movement.end_balance", "Кон. остаток"), align: "right", formatter: (v) => formatQty(Number(v)) },
            { key: "diff", header: t("product_movement.diff", "Разница"), align: "right", formatter: (v) => formatQty(Number(v)) },
          ],
        };
        const result = await exportData(filteredItems, config, fmt);
        if (result.success) {
          showSuccessToast(t("export.success", "Экспортировано успешно"));
        } else {
          showErrorToast(result.error || t("export.error", "Ошибка экспорта"));
        }
      } catch (e) {
        console.error("Export error:", e);
        showErrorToast(t("export.error", "Ошибка экспорта"));
      }
    },
    [filteredItems, showSuccessToast, showErrorToast],
  );

  const handlePrint = useCallback(async () => {
    if (!filteredItems.length) {
      showErrorToast(t("product.no_data_to_print", "Нет данных для печати"));
      return;
    }
    try {
      const config: PrintConfig<ProductMovementItem> = {
        title: t("product_movement.title", "Движение товаров"),
        orientation: "landscape",
        columns: [
          { key: "productName", header: t("product.name", "Товар") },
          { key: "unitName", header: t("product.unit", "Ед.изм") },
          { key: "startBalance", header: t("product_movement.start_balance", "Нач."), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.startBalance) },
          { key: "incomeQty", header: t("product_movement.income", "Закуп"), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.incomeQty) },
          { key: "saleQty", header: t("product_movement.sale", "Прод."), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.saleQty) },
          { key: "returnsQty", header: t("product_movement.returns", "Возвр."), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.returnsQty) },
          { key: "outcomeQty", header: t("product_movement.outcome", "Расх."), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.outcomeQty) },
          { key: "endBalance", header: t("product_movement.end_balance", "Кон."), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.endBalance) },
          { key: "diff", header: t("product_movement.diff", "Разн."), align: "right", formatter: (_v: unknown, row: ProductMovementItem) => formatQty(row.diff) },
        ],
      };
      await openPrintWindow(filteredItems, config);
    } catch (e) {
      console.error("Print error:", e);
      showErrorToast(t("print.error", "Ошибка печати"));
    }
  }, [filteredItems, showErrorToast]);

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Header */}
      <div className="flex flex-wrap bg-background border rounded-lg py-2 px-4 items-center gap-2">
        <div className="flex items-center gap-2 mr-auto">
          <Package className="h-5 w-5 text-indigo-600 shrink-0" />
          <span className="font-medium whitespace-nowrap">
            {t("product_movement.title", "Движение товаров")}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search", "Поиск...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-9 w-[180px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Movement type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {movementFilters.size === 0
                  ? t("common.all", "Все")
                  : `${movementFilters.size} ${t("common.selected", "выбрано")}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuLabel className="text-xs">
                {t("product_movement.filter_by_type", "Фильтр по типу")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={movementFilters.has("sale")}
                onCheckedChange={() => toggleMovementFilter("sale")}
              >
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="h-3 w-3 text-red-600" />
                  {t("product_movement.sale", "Продажа")}
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={movementFilters.has("income")}
                onCheckedChange={() => toggleMovementFilter("income")}
              >
                <span className="flex items-center gap-1.5">
                  <ArrowDownCircle className="h-3 w-3 text-green-600" />
                  {t("product_movement.income", "Закупка")}
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={movementFilters.has("returns")}
                onCheckedChange={() => toggleMovementFilter("returns")}
              >
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 text-cyan-600" />
                  {t("product_movement.returns", "Возврат")}
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={movementFilters.has("outcome")}
                onCheckedChange={() => toggleMovementFilter("outcome")}
              >
                <span className="flex items-center gap-1.5">
                  <ArrowUpCircle className="h-3 w-3 text-orange-600" />
                  {t("product_movement.outcome", "Расход")}
                </span>
              </DropdownMenuCheckboxItem>
              {movementFilters.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setMovementFilters(new Set())}
                  >
                    <span className="text-muted-foreground">
                      {t("common.clear_filter", "Сбросить")}
                    </span>
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <ShiftSelector
            value={selectedShift}
            onSelect={async (shift) => {
              setSelectedShift(shift ?? null);

              if (!shift) {
                // No shift → show today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                await loadReport({
                  dateFrom: todayStart.toISOString(),
                  dateTo: todayEnd.toISOString(),
                  productId: null,
                });
                return;
              }

              const dClose = shift.d_close ?? new Date().toISOString();
              await loadReport({
                dateFrom: shift.d_open,
                dateTo: dClose,
                productId: null,
              });
            }}
            placeholder={t("shift.current_shift")}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (report) {
                loadReport({
                  dateFrom: report.dateFrom,
                  dateTo: report.dateTo,
                  productId: null,
                });
              }
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <DataActions
            onExport={handleExport}
            onPrint={handlePrint}
            exportDisabled={loading || !filteredItems.length}
            printDisabled={loading || !filteredItems.length}
          />
        </div>
      </div>

      {/* Period info */}
      {report && (
        <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
          <span>
            {t("product_movement.period", "Период")}:{" "}
            {formatDate(report.dateFrom)} — {formatDate(report.dateTo)}
          </span>
          <Badge variant="outline" className="ml-auto">
            {searchQuery || movementFilters.size > 0
              ? `${filteredItems.length} / ${activeItems.length}`
              : activeItems.length}{" "}
            {t("product_movement.products", "товаров")}
          </Badge>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t("common.loading", "Загрузка...")}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-red-500">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Main table */}
      {!loading && report && filteredItems.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <div className="overflow-x-auto w-full rounded-md border">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border-b px-2 py-1.5 text-left font-medium sticky left-0 bg-muted/50 z-10 max-w-[180px]">
                      {t("product.name", "Товар")}
                    </th>
                    <th className="border-b px-1.5 py-1.5 text-center font-medium w-[40px]">
                      {t("product.unit", "Ед.")}
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Package className="h-3 w-3 text-blue-600 shrink-0" />
                        <span>{t("product_movement.start_balance", "Нач.")}</span>
                      </div>
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowDownCircle className="h-3 w-3 text-green-600 shrink-0" />
                        <span>{t("product_movement.income", "Закуп")}</span>
                      </div>
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <ShoppingCart className="h-3 w-3 text-red-600 shrink-0" />
                        <span>{t("product_movement.sale", "Прод.")}</span>
                      </div>
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <RefreshCw className="h-3 w-3 text-cyan-600 shrink-0" />
                        <span>{t("product_movement.returns", "Возвр.")}</span>
                      </div>
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowUpCircle className="h-3 w-3 text-orange-600 shrink-0" />
                        <span>{t("product_movement.outcome", "Расх.")}</span>
                      </div>
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Package className="h-3 w-3 text-indigo-600 shrink-0" />
                        <span>{t("product_movement.end_balance", "Кон.")}</span>
                      </div>
                    </th>
                    <th className="border-b px-2 py-1.5 text-right font-medium w-[70px]">
                      {t("product_movement.diff", "Изм.")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item: ProductMovementItem, idx: number) => (
                    <tr
                      key={item.productId}
                      className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
                    >
                      {/* Row number + Product name */}
                      <td className="px-2 py-1.5 sticky left-0 bg-background z-10 max-w-[180px]">
                        <div className="font-medium truncate" title={item.productName}>
                          <span className="text-muted-foreground mr-1 tabular-nums">
                            {startIndex + idx + 1}.
                          </span>
                          {item.productName}
                        </div>
                        {item.productShortName && (
                          <div className="text-[10px] text-muted-foreground truncate" title={item.productShortName}>
                            {item.productShortName}
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="px-1.5 py-1.5 text-center text-muted-foreground">
                        {item.unitName || "—"}
                      </td>

                      {/* Start balance */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums bg-blue-50/50 dark:bg-blue-900/10">
                        {formatQty(item.startBalance)}
                      </td>

                      {/* Income (purchases) */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {item.incomeQty > 0 ? (
                          <span className="text-green-700 dark:text-green-400">
                            +{formatQty(item.incomeQty)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Sale */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {item.saleQty > 0 ? (
                          <span className="text-red-700 dark:text-red-400">
                            −{formatQty(item.saleQty)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Customer returns */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {item.returnsQty > 0 ? (
                          <span className="text-cyan-700 dark:text-cyan-400">
                            +{formatQty(item.returnsQty)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Returns to provider */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {item.outcomeQty > 0 ? (
                          <span className="text-orange-700 dark:text-orange-400">
                            −{formatQty(item.outcomeQty)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* End balance */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums font-semibold bg-indigo-50/50 dark:bg-indigo-900/10">
                        {formatQty(item.endBalance)}
                      </td>

                      {/* Diff */}
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {item.diff > 0 ? (
                          <span className="flex items-center justify-end gap-0.5 text-green-700 dark:text-green-400">
                            <TrendingUp className="h-3 w-3" />
                            +{formatQty(item.diff)}
                          </span>
                        ) : item.diff < 0 ? (
                          <span className="flex items-center justify-end gap-0.5 text-red-700 dark:text-red-400">
                            <TrendingDown className="h-3 w-3" />
                            {formatQty(item.diff)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0.00</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  {totals && (
                    <tr className="bg-muted/60 font-semibold border-t-2 border-t-border">
                      <td className="px-2 py-1.5 sticky left-0 bg-muted/60 z-10">
                        {t("product_movement.total", "Итого")}
                      </td>
                      <td className="px-1.5 py-1.5"></td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {formatQty(totals.startBalance)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-green-700 dark:text-green-400">
                        {totals.incomeQty > 0 ? `+${formatQty(totals.incomeQty)}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-red-700 dark:text-red-400">
                        {totals.saleQty > 0 ? `−${formatQty(totals.saleQty)}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-cyan-700 dark:text-cyan-400">
                        {totals.returnsQty > 0 ? `+${formatQty(totals.returnsQty)}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-orange-700 dark:text-orange-400">
                        {totals.outcomeQty > 0 ? `−${formatQty(totals.outcomeQty)}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {formatQty(totals.endBalance)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {totals.diff > 0 ? (
                          <span className="text-green-700 dark:text-green-400">
                            +{formatQty(totals.diff)}
                          </span>
                        ) : totals.diff < 0 ? (
                          <span className="text-red-700 dark:text-red-400">
                            {formatQty(totals.diff)}
                          </span>
                        ) : (
                          "0.00"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && report && filteredItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {t("common.showing", "Показано")} {startIndex + 1}–
              {Math.min(startIndex + pageSize, totalItems)}{" "}
              {t("common.of", "из")} {totalItems}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && report && filteredItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-30" />
            {searchQuery ? (
              <div className="flex flex-col items-center gap-2">
                <p>{t("common.no_search_results", "Ничего не найдено по запросу")} «{searchQuery}»</p>
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                  {t("common.clear_search", "Сбросить поиск")}
                </Button>
              </div>
            ) : (
              <p>{t("product_movement.no_movement", "Нет движения товаров за выбранный период")}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
