import { ClientEntity } from "@/entities/client";
import { ClientSelector } from "@/entities/client/ui/ClientSelector";
import type { OrderEntity } from "@/entities/order";
import { useOrderStore } from "@/entities/order";
import { OrderSortField } from "@/entities/order/model/types";
import { OrderFilters, OrderList } from "@/features/order";
import useToast from "@/shared/hooks/use-toast";
import { SortOrder } from "@/shared/bindings/SortOrder";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import {
  ManageIOOrders,
  ManageSalerOrdersSheet,
} from "@/widgets/manage-active-orders";
import { AlertCircle, MinusCircle, Package, PlusCircle, TrendingUp } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Memoized stats component
const OrderStats = React.memo(
  ({
    orders,
    selectedItems,
  }: {
    orders: OrderEntity[];
    selectedItems: OrderEntity[];
  }) => {
    const { t } = useTranslation();

    const stats = useMemo(() => {
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => !order.d_move).length;
      const completedOrders = orders.filter(order => order.d_move).length;
      const totalAmount = orders.reduce((sum, order) => sum + order.summ, 0);
      const selectedPending = selectedItems.filter(
        order => !order.d_move
      ).length;

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalAmount,
        selectedPending,
      };
    }, [orders, selectedItems]);

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <CardContent className="p-0 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t("order.total_orders", "Total Orders")}
              </p>
              <p className="text-lg font-semibold">{stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-0 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t("order.pending_orders", "Pending")}
              </p>
              <p className="text-lg font-semibold">{stats.pendingOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-0 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t("order.completed_orders", "Completed")}
              </p>
              <p className="text-lg font-semibold">{stats.completedOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-0 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">
                {t("order.total_amount", "Total Amount")}
              </p>
              <p className="text-lg font-semibold">
                {stats.totalAmount.toLocaleString()} {t("currency.sum", "сум")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
OrderStats.displayName = "OrderStats";

export const OrderManagement = React.memo(() => {
  const { t } = useTranslation();
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<OrderEntity[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(
    null
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIOOrdersSheetOpen, setIsIOOrdersSheetOpen] = useState(false);
  const [isSaleOrdersSheetOpen, setIsSaleOrdersSheetOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [sortFieldState, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<1 | -1>(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const isInitialized = useRef(false);

  // Direct store selectors — no prop drilling
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const pagination = useOrderStore((s) => s.pagination);
  const query = useOrderStore((s) => s.query);
  const loadOrders = useOrderStore((s) => s.loadOrders);
  const loadActiveOrders = useOrderStore((s) => s.loadActiveOrders);
  const addIncomeOrder = useOrderStore((s) => s.addIncomeOrder);
  const addOutcomeOrder = useOrderStore((s) => s.addOutcomeOrder);
  const deleteOrder = useOrderStore((s) => s.deleteOrder);
  const moveOrder = useOrderStore((s) => s.moveOrder);
  const pageChange = useOrderStore((s) => s.pageChange);
  const clearFilter = useOrderStore((s) => s.clearFilter);

  // Load initial data
  useEffect(() => {
    if (!isInitialized.current) {
      loadOrders().catch(showErrorToast);
      loadActiveOrders().catch(showErrorToast);
      isInitialized.current = true;
    }
  }, [loadOrders, loadActiveOrders, showErrorToast]);

  const hasActiveFilters = query.filters
    ? Object.values(query.filters).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (Array.isArray(value) ? value.length > 0 : true)
      )
    : false;

  const onShowFilters = useCallback(() => setFiltersVisible(true), []);
  const onHideFilters = useCallback(() => setFiltersVisible(false), []);

  // Map frontend sort field names to backend OrderColumn enum values
  const mapSortFieldToBackend = (field: string): OrderSortField => {
    const fieldMapping: Record<string, OrderSortField> = {
      id: "Id",
      d_created: "DCreated",
      d_move: "DMove",
      summ: "Summ",
      tax: "Tax",
      order_type: "OrderType",
    };
    return fieldMapping[field] || "DCreated";
  };

  const onSort = useCallback(
    (field: string, order: 1 | -1) => {
      const so: SortOrder = order === 1 ? "Asc" : "Desc";
      const backendField = mapSortFieldToBackend(field);
      loadOrders({ sortField: backendField, sortOrder: so });
    },
    [loadOrders]
  );

  const onDelete = useCallback(
    async (order: OrderEntity) => {
      if (!order.id) return;
      try {
        await deleteOrder(order.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteOrder, showErrorToast, showSuccessToast, t]
  );

  const onMove = useCallback(
    async (order: OrderEntity) => {
      if (!order.id) return;
      try {
        await moveOrder(order.id);
        showSuccessToast(t("order.moved_successfully"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [moveOrder, showErrorToast, showSuccessToast, t]
  );

  const handleAddIncomeOrder = useCallback(
    (clientId: string) => addIncomeOrder(clientId),
    [addIncomeOrder]
  );

  const handleAddOutcomeOrder = useCallback(
    (clientId?: string | null) => addOutcomeOrder(clientId === null ? undefined : clientId),
    [addOutcomeOrder]
  );

  // Memoized pending orders count
  const pendingOrdersCount = useMemo(
    () => selectedItems.filter(order => !order.d_move).length,
    [selectedItems]
  );

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      const deletePromises = selectedItems
        .filter(order => order.id)
        .map(order => onDelete(order));

      await Promise.allSettled(deletePromises);

      showSuccessToast(t("success.data_deleted"));
      setSelectedItems([]);
      setBulkDeleteOpen(false);
    } catch (error: any) {
      showErrorToast(
        error.message || t("error.delete_failed", "Delete failed")
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedItems,
    onDelete,
    showSuccessToast,
    showErrorToast,
    t,
    isProcessing,
  ]);

  // Handle bulk move
  const handleBulkMove = useCallback(async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      const movePromises = selectedItems
        .filter(order => order.id && !order.d_move)
        .map(order => onMove(order));

      await Promise.allSettled(movePromises);

      showSuccessToast(t("order.bulk_moved_successfully"));
      setSelectedItems([]);
      setBulkMoveOpen(false);
    } catch (error: any) {
      showErrorToast(error.message || t("error.move_failed", "Move failed"));
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedItems,
    onMove,
    showSuccessToast,
    showErrorToast,
    t,
    isProcessing,
  ]);

  // Handle selection change
  const handleSelectionChange = useCallback((selected: OrderEntity[]) => {
    setSelectedItems(selected);
  }, []);

  // Handle edit order - open appropriate sheet based on order type
  const handleViewOrder = useCallback((order: OrderEntity) => {
    setActiveOrderId(order.id || null);

    // Open appropriate sheet based on order type
    if (order.order_type === "Income" || order.order_type === "Outcome") {
      setIsIOOrdersSheetOpen(true);
    } else {
      // Sale, Returns
      setIsSaleOrdersSheetOpen(true);
    }
  }, []);

     // Handle show order - open appropriate sheet based on order type
  const handleEditOrder = useCallback((order: OrderEntity) => {
    setActiveOrderId(order.id || null);

    // Open appropriate sheet based on order type
    if (order.order_type === "Income" || order.order_type === "Outcome") {
      setIsIOOrdersSheetOpen(true);
    } else {
      // Sale, Returns
      setIsSaleOrdersSheetOpen(true);
    }
  }, []);

  // Handle add income order
  const handleAddIncomeOrderClick = useCallback(async () => {
    if (selectedClient && selectedClient.id !== null) {
      try {
        const newOrderId = await handleAddIncomeOrder(
          selectedClient.id
        );
        // Open the I/O sheet with the new order
        setIsIOOrdersSheetOpen(true);
        setActiveOrderId(newOrderId);
        showSuccessToast(
          t("order.order_created_successfully", "Order created successfully")
        );
      } catch (error: any) {
        showErrorToast(
          error.message ||
            t("error.failed_to_create_order", "Failed to create order")
        );
      }
    } else {
      showErrorToast(
        t("order.select_client_first", "Please select a client first")
      );
    }
  }, [
    selectedClient,
    handleAddIncomeOrder,
    showErrorToast,
    showSuccessToast,
    t,
  ]);

  // Handle add income order
  const handleAddOutcomeOrderClick = useCallback(async () => {
    try {
      const newOrderId = await handleAddOutcomeOrder(
        selectedClient?.id
      );
      // Open the I/O sheet with the new order
      setIsIOOrdersSheetOpen(true);
      setActiveOrderId(newOrderId);
      showSuccessToast(
        t("order.order_created_successfully", "Order created successfully")
      );
    } catch (error: any) {
      showErrorToast(
        error.message ||
          t("error.failed_to_create_order", "Failed to create order")
      );
    }
  }, [
    selectedClient,
    handleAddOutcomeOrder,
    showErrorToast,
    showSuccessToast,
    t,
  ]);

  // Handle client selection
  const handleClientSelect = useCallback((client: ClientEntity | null) => {
    setSelectedClient(client);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback(
    (field: string, order: 1 | -1) => {
      setSortField(field);
      setSortOrder(order);
      onSort(field, order);
    },
    [onSort]
  );

  const sortFields = [
    { value: "id", label: t("order.id") },
    { value: "order_type", label: t("order.order_type") },
    { value: "client", label: t("order.client") },
    { value: "d_created", label: t("order.d_created") },
    { value: "d_move", label: t("order.d_move") },
    { value: "summ", label: t("order.summ") },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-background border rounded-lg py-2 px-3 sm:px-4">
        <PageHeader
          title="menu.main.orders"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          clearFilters={clearFilter}
          selectedCount={selectedItems.length}
          onBulkDelete={
            selectedItems.length > 0
              ? () => setBulkDeleteOpen(true)
              : undefined
          }
          showAddButton={false}
          showSort={true}
          sortField={sortFieldState}
          sortOrder={sortOrder}
          sortFields={sortFields}
          onSortChange={handleSortChange}
        />

        {/* Controls: client selector + add income on one row, bulk move alongside and wrap when needed */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Client selector and Add income grouped together so button is immediately to the right */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:flex-1 min-w-0  sm:min-w-[220px]">
              <ClientSelector
                onSelect={handleClientSelect}
                value={selectedClient}
                placeholder={t(
                  "order.select_client_for_new_order",
                  "Select client for new order"
                )}
                disabled={isProcessing}
              />
            </div>

            {/* Add income placed immediately to the right of the selector */}
            {selectedClient && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAddIncomeOrderClick}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                {t("order.income")}
              </Button>
            )}
            {
              <Button
                variant="default"
                size="sm"
                onClick={handleAddOutcomeOrderClick}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                <MinusCircle className="h-4 w-4 mr-1" />
                {t("order.outcome")}
              </Button>
            }
          </div>

          {/* Bulk move */}
          {pendingOrdersCount > 0 && (
            <Button
              onClick={() => setBulkMoveOpen(true)}
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {t("order.move_selected")} ({pendingOrdersCount})
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <OrderList
        orders={orders}
        loading={loading || isProcessing}
        pagination={pagination}
        onEdit={handleEditOrder}
        onView={handleViewOrder}
        onDelete={onDelete}
        onMove={onMove}
        onPageChange={pageChange}
        // onPageSizeChange={onPageSizeChange}
        onSort={onSort}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />

      {/* Filters Dialog */}
      <OrderFilters open={filtersVisible} onClose={onHideFilters} />

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        open={bulkDeleteOpen}
        title={t("message.confirm_bulk_delete")}
        description={
          <div className="space-y-2">
            <p>
              {t("message.bulk_delete_warning", {
                count: selectedItems.length,
              })}
            </p>
            <p className="text-red-600 font-medium text-sm">
              {t("message.action_irreversible")}
            </p>
          </div>
        }
        confirmLabel={`${t("control.delete")} (${selectedItems.length})`}
        cancelLabel={t("control.cancel")}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />

      {/* Income/Outcome Orders Sheet */}
      <ManageIOOrders
        open={isIOOrdersSheetOpen}
        onOpenChange={setIsIOOrdersSheetOpen}
        activeOrderId={activeOrderId}
      />

      {/* Sale/Returns Orders Sheet */}
      <ManageSalerOrdersSheet
        open={isSaleOrdersSheetOpen}
        onOpenChange={setIsSaleOrdersSheetOpen}
        activeOrderId={activeOrderId}
      />

      {/* Bulk Move Confirmation */}
      <ConfirmationDialog
        open={bulkMoveOpen}
        title={t("order.confirm_bulk_move")}
        description={
          <div className="space-y-2">
            <p>{t("order.bulk_move_warning", { count: pendingOrdersCount })}</p>
            <p className="text-blue-600 font-medium text-sm">
              {t("order.bulk_move_info")}
            </p>
          </div>
        }
        confirmLabel={`${t("order.move_orders")} (${pendingOrdersCount})`}
        cancelLabel={t("control.cancel")}
        onConfirm={handleBulkMove}
        onCancel={() => setBulkMoveOpen(false)}
        confirmClassName="bg-blue-600 hover:bg-blue-700"
      />
    </div>
  );
});

OrderManagement.displayName = "OrderManagement";
