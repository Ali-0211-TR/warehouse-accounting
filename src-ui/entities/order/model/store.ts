import { ProductEntity } from "@/entities/product";
import { useProductStore } from "@/entities/product/model/store";
import { AddProductDTO } from "@/shared/bindings/dtos/AddProductDTO";
import { CloseOrderDTO } from "@/shared/bindings/dtos/CloseOrderDTO";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { SortOrder } from "@/shared/bindings/SortOrder";
import {
  defaultPagination,
  PaginationInfo,
} from "@/shared/const/realworld.types";
import { create } from "zustand";
import { orderApi } from "../api/order-api";
import { initOrderFilter } from "./schemas";
import type {
  OrderEntity,
  OrderFilter,
  OrderLazyFilters,
  OrderSortField,
} from "./types";
import type { ClientEntity } from "@/entities/client"; // ✅ ДОБАВИЛ

interface OrderQueryData {
  first: number;
  rows: number;
  page: number;
  sortField?: OrderSortField;
  sortOrder?: SortOrder;
  filters: OrderFilter;
}

interface OrderStore {
  orders: OrderEntity[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  query: OrderQueryData;

  activeOrders: OrderEntity[];
  selectedOrder: OrderEntity | null;

  isOrdersSheetOpen: boolean;
  ordersSheetActiveOrderId: string | null;

  isWarehouseOrdersDialogOpen: boolean;
  openWarehouseOrdersDialog: (orderId?: string | null) => void;
  closeWarehouseOrdersDialog: () => void;

  loadOrders: (params?: Partial<OrderQueryData>) => Promise<void>;
  loadActiveOrders: () => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  moveOrder: (id: string) => Promise<OrderEntity>;
  discardOrder: (id: string, reason?: string) => Promise<OrderEntity>;
  addSaleOrder: (clientId?: string) => Promise<void>;
  addReturnOrder: (clientId?: string) => Promise<string>;
  addIncomeOrder: (clientId?: string) => Promise<string>;
  addOutcomeOrder: (clientId?: string) => Promise<string>;

  // ✅ ОБНОВИЛ СИГНАТУРУ: можно передать объект клиента (для UI)
  setActiveOrderClient: (
    orderId: string,
    clientId: string | null,
    client?: ClientEntity | null
  ) => Promise<void>;

  addOrderItem: (
    orderItem: AddProductDTO
  ) => Promise<[OrderEntity, ProductEntity]>;
  removeOrderItem: (orderItemId: string) => Promise<void>;
  updateOrAddActiverOrder: (order: OrderEntity) => void;

  selectActiveOrder: (id: string | null) => void;
  clearSelection: () => void;
  closeActiveOrder: (params: CloseOrderDTO) => Promise<void>;
  removeOrderFromActive: (id: string) => void;
  closeFueling: (id: string) => void;

  openOrdersSheet: (orderId?: string | null) => void;
  closeOrdersSheet: () => void;
  setOrdersSheetActiveOrder: (orderId: string | null) => void;

  pageChange: (pageNum: number) => Promise<void>;
  setFilters: (filters: Partial<OrderFilter>) => Promise<void>;
  clearFilter: () => Promise<void>;
  clearError: () => void;
  reset: () => void;

  clearSelectedOrder: () => void;
}

const initialOrderQuery: OrderQueryData = {
  first: 0,
  rows: 25,
  page: 1,
  sortField: "DCreated",
  sortOrder: "Desc" as SortOrder,
  filters: initOrderFilter,
};

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  pagination: defaultPagination,
  loading: false,
  error: null,
  query: initialOrderQuery,

  activeOrders: [],
  selectedOrder: null,

  isOrdersSheetOpen: false,
  ordersSheetActiveOrderId: null,

  isWarehouseOrdersDialogOpen: false,

  loadOrders: async (params?: Partial<OrderQueryData>) => {
    set({ loading: true, error: null });

    const currentQuery = get().query;
    const newQuery = { ...currentQuery, ...params };

    if (params?.filters) {
      newQuery.first = 0;
      newQuery.page = 1;
    }

    try {
      const lazyParams: LazyTableStateDTO<OrderLazyFilters, OrderSortField> = {
        first: newQuery.first,
        rows: newQuery.rows,
        page: newQuery.page,
        sort_field: newQuery.sortField || "DCreated",
        sort_order: newQuery.sortOrder || "Desc",
        filters: newQuery.filters,
      };

      const result = await orderApi.getOrders(lazyParams);

      set({
        orders: result.items,
        pagination: { ...result },
        query: newQuery,
        loading: false,
      });

      const currentSelected = get().selectedOrder;
      if (currentSelected?.id) {
        const updatedOrder = result.items.find(
          (order) => order.id === currentSelected.id
        );
        if (updatedOrder) set({ selectedOrder: updatedOrder });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadActiveOrders: async () => {
    try {
      let activeOrders = await orderApi.getActiveOrders();
      activeOrders = [...activeOrders].sort((a, b) => (b.id! > a.id! ? 1 : -1));
      set({ activeOrders });

      const currentSelected = get().selectedOrder;
      if (currentSelected?.id) {
        const updatedOrder = activeOrders.find(
          (order) => order.id === currentSelected.id
        );
        if (updatedOrder) set({ selectedOrder: updatedOrder });
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateOrAddActiverOrder: (order: OrderEntity) => {
    set((state) => {
      if (!order || !order.id) return state;

      const existingIndex = state.activeOrders.findIndex((o) => o.id === order.id);

      if (existingIndex !== -1) {
        const existing = state.activeOrders[existingIndex];

        // Skip update if order data hasn't changed (shallow check on key fields)
        // Also compare fueling order data (volume/amount) which changes during active fueling
        const existingFuelingItem = existing.items?.find((item: any) => item.id === existing.fueling_order_item_id);
        const newFuelingItem = order.items?.find((item: any) => item.id === order.fueling_order_item_id);
        const existingFueling = existingFuelingItem?.fueling_order;
        const newFueling = newFuelingItem?.fueling_order;

        if (
          existing.summ === order.summ &&
          existing.tax === order.tax &&
          existing.d_move === order.d_move &&
          existing.discard === order.discard &&
          existing.client?.id === order.client?.id &&
          existing.items?.length === order.items?.length &&
          existingFueling?.volume === newFueling?.volume &&
          existingFueling?.amount === newFueling?.amount &&
          existingFueling?.d_move === newFueling?.d_move
        ) {
          return state;
        }

        const newActiveOrders = state.activeOrders.slice();
        newActiveOrders[existingIndex] = order;

        return {
          ...state,
          activeOrders: newActiveOrders,
          selectedOrder:
            state.selectedOrder?.id === order.id ? order : state.selectedOrder,
        };
      }

      return {
        ...state,
        activeOrders: [...state.activeOrders, order],
      };
    });
  },

  deleteOrder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await orderApi.deleteOrder(id);

      set((state) => ({
        selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
        activeOrders: state.activeOrders.filter((o) => o.id !== id),
        orders: state.orders.filter((o) => o.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  moveOrder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const movedOrder = await orderApi.moveOrder(id);

      set((state) => ({
        selectedOrder: state.selectedOrder?.id === id ? movedOrder : state.selectedOrder,
        activeOrders: state.activeOrders.filter((o) => o.id !== id),
        orders: state.orders.map((o) => (o.id === id ? movedOrder : o)),
        loading: false,
      }));

      return movedOrder;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  discardOrder: async (id: string, reason?: string) => {
    set({ loading: true, error: null });
    try {
      const discardedOrder = await orderApi.discardOrder(id, reason);

      set((state) => ({
        selectedOrder: state.selectedOrder?.id === id ? discardedOrder : state.selectedOrder,
        activeOrders: state.activeOrders.filter((o) => o.id !== id),
        orders: state.orders.map((o) => (o.id === id ? discardedOrder : o)),
        loading: false,
      }));

      return discardedOrder;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addSaleOrder: async (clientId?: string) => {
    set({ loading: true, error: null });
    try {
      const addedOrderID = await orderApi.addSaleOrder(clientId);
      await get().loadActiveOrders();
      get().selectActiveOrder(addedOrderID);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addReturnOrder: async (clientId?: string) => {
    set({ loading: true, error: null });
    try {
      const newOrderId = await orderApi.addReturnOrder(clientId);
      await get().loadActiveOrders();
      return newOrderId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addOutcomeOrder: async (clientId?: string) => {
    set({ loading: true, error: null });
    try {
      const newOrderId = await orderApi.addOutcomeOrder(clientId);
      await get().loadActiveOrders();
      return newOrderId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addIncomeOrder: async (clientId?: string) => {
    set({ loading: true, error: null });
    try {
      if (typeof clientId !== "string") {
        throw new Error("clientId is required for addIncomeOrder");
      }

      const newOrderId = await orderApi.addIncomeOrder(clientId);
      await get().loadActiveOrders();
      return newOrderId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ
  setActiveOrderClient: async (
    orderId: string,
    clientId: string | null,
    client?: ClientEntity | null
  ) => {
    // 1) ✅ Оптимистично обновляем UI сразу
    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              client_id: clientId,
              client: clientId ? (client ?? o.client ?? null) : null,
            }
          : o
      ),
      selectedOrder:
        state.selectedOrder?.id === orderId
          ? {
              ...state.selectedOrder,
              client_id: clientId,
              client: clientId ? (client ?? state.selectedOrder.client ?? null) : null,
            }
          : state.selectedOrder,
    }));

    try {
      // 2) ✅ Запрос на бэк
      const updatedOrder = await orderApi.setActiveOrderClient(orderId, clientId);

      // 3) ✅ Если бэк вернул без `client`, мы НЕ теряем client из UI
      set((state) => {
        const prev = state.activeOrders.find((o) => o.id === orderId);

        const merged: OrderEntity = {
          ...(prev ?? ({} as OrderEntity)),
          ...updatedOrder,
          client: clientId
            ? (updatedOrder as any).client ?? client ?? prev?.client ?? null
            : null,
        };

        return {
          activeOrders: state.activeOrders.map((o) =>
            o.id === orderId ? merged : o
          ),
          selectedOrder:
            state.selectedOrder?.id === orderId ? merged : state.selectedOrder,
        };
      });
    } catch (error: any) {
      set({ error: error.message });
      // ❗️по желанию можно откатить через loadActiveOrders()
      // await get().loadActiveOrders();
      throw error;
    }
  },

  addOrderItem: async (orderItemDto: AddProductDTO) => {
    try {
      const [order, product] = await orderApi.addOrderItem(orderItemDto);

      set((state) => ({
        activeOrders: state.activeOrders.map((o) =>
          o.id === order.id ? order : o
        ),
        selectedOrder: state.selectedOrder?.id === order.id ? order : state.selectedOrder,
      }));

      useProductStore.getState().setProduct(product);

      return [order, product] as [OrderEntity, ProductEntity];
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeOrderItem: async (orderItemId: string) => {
    try {
      const selectedOrder = get().selectedOrder;
      if (!selectedOrder?.id) throw new Error("No order selected");

      const updatedOrder = await orderApi.removeOrderItem(
        selectedOrder.id,
        orderItemId
      );

      set({ selectedOrder: updatedOrder });
      get().updateOrAddActiverOrder(updatedOrder);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  selectActiveOrder: (id: string | null) => {
    if (id === null) {
      set({ selectedOrder: null });
      return;
    }

    const { activeOrders } = get();
    const order = activeOrders.find((o) => o.id === id);
    set({ selectedOrder: order ?? null });
  },

  clearSelection: () => set({ selectedOrder: null }),

  closeActiveOrder: async (closeOrderDto: CloseOrderDTO) => {
    try {
      const closedOrder: OrderEntity = await orderApi.closeActiveOrder(closeOrderDto);

      set((state) => ({
        orders: state.orders.map((o) => (o.id === closedOrder.id ? closedOrder : o)),
        // если закрыли выбранный — обновим
        selectedOrder: state.selectedOrder?.id === closedOrder.id ? closedOrder : state.selectedOrder,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeOrderFromActive: (id: string) => {
    set((state) => ({
      activeOrders: state.activeOrders.filter((o) => o.id !== id),
      selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
      ordersSheetActiveOrderId:
        state.ordersSheetActiveOrderId === id ? null : state.ordersSheetActiveOrderId,
    }));
  },

  closeFueling: (order_id: string) => {
    orderApi
      .closeFueling(order_id)
      .then((newOrder) => {
        set((state) => ({
          activeOrders: state.activeOrders.map((o) =>
            o.id === order_id ? newOrder : o
          ),
          selectedOrder: state.selectedOrder?.id === order_id ? newOrder : state.selectedOrder,
        }));
      })
      .catch((error: any) => {
        set({ error: error.message });
      });
  },

  openOrdersSheet: (orderId = null) => {
    set({
      isOrdersSheetOpen: true,
      ordersSheetActiveOrderId: orderId,
    });

    if (orderId !== null) get().selectActiveOrder(orderId);
  },

  closeOrdersSheet: () => {
    set({
      isOrdersSheetOpen: false,
      ordersSheetActiveOrderId: null,
    });
  },

  setOrdersSheetActiveOrder: (orderId: string | null) => {
    set({ ordersSheetActiveOrderId: orderId });
    get().selectActiveOrder(orderId);
  },

  openWarehouseOrdersDialog: (orderId = null) => {
    set({ isWarehouseOrdersDialogOpen: true });
    if (orderId !== null) get().selectActiveOrder(orderId);
  },

  closeWarehouseOrdersDialog: () => {
    set({ isWarehouseOrdersDialogOpen: false });
  },

  setFilters: async (f: Partial<OrderFilter>) => {
    const oldFilter = get().query.filters || {};
    const newFilter = { ...oldFilter, ...f };
    try {
      await get().loadOrders({ filters: newFilter });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  clearFilter: async () => {
    await get().loadOrders({ filters: initOrderFilter });
  },

  pageChange: async (page: number) => {
    await get().loadOrders({ page });
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      orders: [],
      pagination: defaultPagination,
      loading: false,
      error: null,
      query: initialOrderQuery,
      activeOrders: [],
      selectedOrder: null,
      isOrdersSheetOpen: false,
      ordersSheetActiveOrderId: null,
      isWarehouseOrdersDialogOpen: false,
    }),

  clearSelectedOrder: () => set({ selectedOrder: null }),
}));
