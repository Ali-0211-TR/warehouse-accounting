import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { MetaPaginatorDTO } from "@/shared/bindings/dtos/MetaPaginatorDTO";
import { OrderMovementSummaryMeta } from "@/shared/bindings/dtos/OrderMovementSummaryMeta";
import { SortOrder } from "@/shared/bindings/SortOrder";
import { create } from "zustand";
import { orderApi } from "../api/order-api";
import { initOrderFilter } from "./schemas";
import type {
  OrderEntity,
  OrderFilter,
  OrderLazyFilters,
  OrderSortField,
} from "./types";

interface OrderQueryData {
  first: number;
  rows: number;
  page: number;
  sortField?: OrderSortField;
  sortOrder?: SortOrder;
  filters: OrderFilter;
}

interface OrderMovementStore {
  orders: MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>;
  loading: boolean;
  error: string | null;
  query: OrderQueryData;

  loadData: (params?: Partial<OrderQueryData>) => Promise<void>;

  pageChange: (pageNum: number) => Promise<void>;
  sortData: (field: string, order: 1 | -1) => Promise<void>;
  setFilters: (filters: Partial<OrderFilter>) => Promise<void>;
  clearFilter: () => Promise<void>;
  loadAllForExport: () => Promise<OrderEntity[]>;
  clearError: () => void;
  reset: () => void;
}

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

const initialData: MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta> = {
  page: 1,
  items: [],
  count: 0,
  limit: 25,
  pageCount: 0,
  meta: {
    totalSum: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalIncoming: 0,
    totalOutgoing: 0,
    totalsByType: {
      incomeSum: 0,
      incomeTax: 0,
      incomeDiscount: 0,
      outcomeSum: 0,
      outcomeTax: 0,
      outcomeDiscount: 0,
      saleSum: 0,
      saleTax: 0,
      saleDiscount: 0,
      saleDispenserSum: 0,
      saleDispenserTax: 0,
      saleDispenserDiscount: 0,
      returnsSum: 0,
      returnsTax: 0,
      returnsDiscount: 0,
      incomeFuelSum: 0,
      incomeFuelTax: 0,
      incomeFuelDiscount: 0,
      incomeGoodsSum: 0,
      incomeGoodsTax: 0,
      incomeGoodsDiscount: 0,
      outcomeFuelSum: 0,
      outcomeFuelTax: 0,
      outcomeFuelDiscount: 0,
      outcomeGoodsSum: 0,
      outcomeGoodsTax: 0,
      outcomeGoodsDiscount: 0,
    },
  },
};

const initialOrderQuery: OrderQueryData = {
  first: 0,
  rows: 25,
  page: 1,
  sortField: "DCreated",
  sortOrder: "Desc" as SortOrder,
  filters: initOrderFilter,
};

export const useOrderMovementStore = create<OrderMovementStore>()(
  (set, get) => ({
    orders: initialData,
    loading: false,
    error: null,
    query: initialOrderQuery,

    loadData: async (params?: Partial<OrderQueryData>) => {
      set({ loading: true, error: null });

      const currentQuery = get().query;
      const newQuery = { ...currentQuery, ...params };

      // If filters changed, reset to first page
      if (params?.filters) {
        newQuery.first = 0;
        newQuery.page = 1;
      }

      try {
        const lazyParams: LazyTableStateDTO<OrderLazyFilters, OrderSortField> =
          {
            first: newQuery.first,
            rows: newQuery.rows,
            page: newQuery.page,
            sort_field: newQuery.sortField || "DCreated",
            sort_order: newQuery.sortOrder || "Desc",
            filters: newQuery.filters,
          };

        const result = await orderApi.getMovementReport(lazyParams);
        set({
          orders: result,
          query: newQuery,
          loading: false,
        });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    sortData: async (field: string, order: 1 | -1) => {
      const sortOrder: SortOrder = order === 1 ? "Asc" : "Desc";
      const backendField = mapSortFieldToBackend(field);
      await get().loadData({ sortField: backendField, sortOrder });
    },

    setFilters: async (f: Partial<OrderFilter>) => {
      const oldFilter = get().query.filters || {};
      const newFilter = { ...oldFilter, ...f };
      try {
        await get().loadData({ filters: newFilter });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    clearFilter: async () => {
      await get().loadData({ filters: initOrderFilter });
    },

    loadAllForExport: async (): Promise<OrderEntity[]> => {
      const { query, orders } = get();
      const totalCount = orders.count;
      if (totalCount <= 0) return [];

      // If all items are already on the current page, return them
      if (orders.items.length >= totalCount) return orders.items;

      // Load ALL records matching current filters
      const lazyParams: LazyTableStateDTO<OrderLazyFilters, OrderSortField> = {
        first: 0,
        rows: totalCount,
        page: 1,
        sort_field: query.sortField || "DCreated",
        sort_order: query.sortOrder || "Desc",
        filters: query.filters,
      };

      const result = await orderApi.getMovementReport(lazyParams);
      return result.items;
    },

    pageChange: async (page: number) => {
      await get().loadData({ page });
    },
    clearError: () => set({ error: null }),

    reset: () =>
      set({
        orders: initialData,
        loading: false,
        error: null,
        query: initialOrderQuery,
      }),
  })
);
