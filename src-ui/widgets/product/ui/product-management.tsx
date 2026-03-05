import {
  ProductList,
  ProductForm,
  ProductFilters,
  useProduct,
  useProductPaginated,
} from "@/features/product";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { DatePicker } from "@/shared/ui/components/DatePicker";
import { Button } from "@/shared/ui/shadcn/button";
import { Label } from "@/shared/ui/shadcn/label";
import { useState, useCallback, useRef } from "react";
import { t } from "i18next";
import useToast from "@/shared/hooks/use-toast";
import type { ProductEntity } from "@/entities/product";
import { Calculator, CalendarRange, X } from "lucide-react";
import React from "react";

export function ProductManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<ProductEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Server-side paginated listing
  const {
    products,
    loading: paginatedLoading,
    pagination,
    hasActiveFilters: hasPaginatedFilters,
    reload,
    pageChange,
    onSort,
    setSearch,
    setActiveInPeriod,
    clearAllFilters,
  } = useProductPaginated();

  // Debounced search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setSearch(value);
      }, 300);
    },
    [setSearch],
  );

  // Period filter state (local for UI)
  const [periodFrom, setPeriodFrom] = useState<string | undefined>(undefined);
  const [periodTo, setPeriodTo] = useState<string | undefined>(undefined);
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);

  const handleApplyPeriod = useCallback(() => {
    setActiveInPeriod(periodFrom || null, periodTo || null);
  }, [periodFrom, periodTo, setActiveInPeriod]);

  const handleClearPeriod = useCallback(() => {
    setPeriodFrom(undefined);
    setPeriodTo(undefined);
    setActiveInPeriod(null, null);
    setShowPeriodFilter(false);
  }, [setActiveInPeriod]);

  // CRUD operations — still use the old store-based hook
  const {
    selectedProduct,
    formVisible,
    filtersVisible,
    onEdit,
    onAdd,
    onDelete,
    onSave: onSaveOriginal,
    onCancel,
    onShowFilters,
    onHideFilters,
    filters,
    setFilters,
    clearFilters: clearCrudFilters,
    calculateAllBalances,
  } = useProduct();

  // After CRUD save, reload paginated list
  const onSave = useCallback(
    async (product: any) => {
      await onSaveOriginal(product);
      reload();
    },
    [onSaveOriginal, reload],
  );

  // After delete, reload paginated list
  const handleDelete = useCallback(
    async (product: ProductEntity) => {
      await onDelete(product);
      reload();
    },
    [onDelete, reload],
  );

  // Handle sort from ServerEntityTable (field string, order 1|-1) → ProductColumn
  const handleSort = useCallback(
    (field: string, order: 1 | -1) => {
      const columnMap: Record<string, "Name" | "Article" | "ProductType" | "Balance" | "CreatedAt" | "UpdatedAt"> = {
        name: "Name",
        article: "Article",
        product_type: "ProductType",
        balance: "Balance",
        created_at: "CreatedAt",
        updated_at: "UpdatedAt",
      };
      const col = columnMap[field] || "Article";
      onSort(col, order === 1 ? "Asc" : "Desc");
    },
    [onSort],
  );

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const product of selectedItems) {
        if (product.id) {
          await onDelete(product);
        }
      }
      showSuccessToast(t("success.data_deleted"));
      setSelectedItems([]);
      setBulkDeleteOpen(false);
      reload();
    } catch (error: any) {
      showErrorToast(error.message);
      setBulkDeleteOpen(false);
    }
  };

  const handleCalculateAllBalances = async () => {
    try {
      await calculateAllBalances();
      showSuccessToast(t("success.balances_calculated"));
      reload();
    } catch (error: any) {
      showErrorToast(error.message);
    }
  };

  const handleSelectionChange = React.useCallback((selected: ProductEntity[]) => {
    setSelectedItems(selected);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between gap-2">
        <PageHeader
          title="menu.dictionary.products"
          hasActiveFilters={hasPaginatedFilters}
          onShowFilters={onShowFilters}
          onAdd={onAdd}
          clearFilters={() => {
            clearCrudFilters();
            clearAllFilters();
            setSearchValue("");
            handleClearPeriod();
          }}
          selectedCount={selectedItems.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          // search props
          showSearch
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          searchDebounceMs={0}
          onClearSearch={() => {
            setSearchValue("");
            setSearch("");
          }}
          searchPlaceholderKey="control.search"
        />

        <div className="flex items-center gap-2">
          <Button
            variant={showPeriodFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPeriodFilter(!showPeriodFilter)}
            title={t("product.filter_by_period", "Фильтр по периоду")}
          >
            <CalendarRange className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">
              {t("product.period", "Период")}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculateAllBalances}
            title={t("product.calculate_balance")}
          >
            <Calculator className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">
              {t("product.calculate_balance")}
            </span>
          </Button>
        </div>
      </div>

      {/* Period filter bar */}
      {showPeriodFilter && (
        <div className="flex bg-background border rounded-lg py-2 px-4 items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("common.date_from", "С")}
            </Label>
            <DatePicker
              value={periodFrom}
              onChange={(d) => setPeriodFrom(d)}
              placeholder={t("common.date_from", "С")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("common.date_to", "По")}
            </Label>
            <DatePicker
              value={periodTo}
              onChange={(d) => setPeriodTo(d)}
              placeholder={t("common.date_to", "По")}
            />
          </div>
          <Button size="sm" onClick={handleApplyPeriod}>
            {t("control.apply", "Применить")}
          </Button>
          {(periodFrom || periodTo) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearPeriod}
            >
              <X className="h-4 w-4 mr-1" />
              {t("control.clear", "Сбросить")}
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {t("product.period_hint", "Показать только товары, задействованные в указанном периоде")}
          </span>
        </div>
      )}

      {/* Pagination info */}
      {pagination.count > 0 && (
        <div className="text-sm text-muted-foreground px-1">
          {t("pagination.total", "Всего")}: {pagination.count}{" "}
          {t("product.products_label", "товаров")}
        </div>
      )}

      <ProductList
        products={products}
        loading={paginatedLoading}
        onEdit={onEdit}
        onDelete={handleDelete}
        selectable={true}
        onSelectionChange={handleSelectionChange}
        pagination={pagination}
        onPageChange={pageChange}
        onSort={handleSort}
      />

      {/* Filters Dialog */}
      <ProductFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <ProductForm
          visible={formVisible}
          onHide={onCancel}
          product={selectedProduct}
          onSave={onSave}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        open={bulkDeleteOpen}
        title={t("message.confirm_bulk_delete")}
        description={
          <>
            {t("message.bulk_delete_warning", { count: selectedItems.length })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={`${t("control.delete")} (${selectedItems.length})`}
        cancelLabel={t("control.cancel")}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
