import { FuelingOrderColumn } from "@/shared/bindings/FuelingOrderColumn";
import { FuelingOrderFilter } from "@/shared/bindings/FuelingOrderFilter";
import { OrderItemEntity } from "@/shared/bindings/OrderItemEntity";
import { FuelingSumaryMeta } from "@/shared/bindings/dtos/FuelingSumaryMeta";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { MetaPaginatorDTO } from "@/shared/bindings/dtos/MetaPaginatorDTO";
import { create } from "zustand";
import { fuelingOrderItemApi } from "../api/fueling-order-api";

interface FuelingOrderQueryData {
  first: number;
  rows: number;
  page: number;
  sortField?: FuelingOrderColumn;
  sortOrder?: "Asc" | "Desc";
  filters: FuelingOrderFilter;
}

interface FuelingOrderStorState {
  fuelingOrderitems: MetaPaginatorDTO<
    OrderItemEntity,
    FuelingSumaryMeta
  > | null;
  loading: boolean;
  query: FuelingOrderQueryData;
  getFuelingOrderItems: (
    params?: Partial<FuelingOrderQueryData>
  ) => Promise<void>;
  pageChange: (pageNum: number) => Promise<void>;
  loadAllForExport: () => Promise<OrderItemEntity[]>;
}

const initialQuery: FuelingOrderQueryData = {
  first: 0,
  rows: 25,
  page: 1,
  sortField: "DCreated",
  sortOrder: "Desc",
  filters: {
    id: null,
    order_item_id: null,
    nozzle_id: null,
    d_created: null,
    d_move: null,
    fueling_type: null,
    preset_type: null,
    title: null,
  },
};

export const useFuelingOrderStore = create<FuelingOrderStorState>(
  (set, get) => ({
    fuelingOrderitems: null,
    query: initialQuery,
    pagination: {
      page: 0,
      count: 0,
      limit: 0,
      pageCount: 0,
    },
    loading: false,
    getFuelingOrderItems: async (params?: Partial<FuelingOrderQueryData>) => {
      const currentQuery = get().query;
      const newQuery = { ...currentQuery, ...params };

      // If filters changed, reset to first page
      if (params?.filters) {
        newQuery.first = 0;
        newQuery.page = 1;
      }

      const lazyParams: LazyTableStateDTO<
        FuelingOrderFilter,
        FuelingOrderColumn
      > = {
        first: newQuery.first,
        rows: newQuery.rows,
        page: newQuery.page,
        sort_field: newQuery.sortField || "DCreated",
        sort_order: newQuery.sortOrder || "Desc",
        filters: newQuery.filters,
      };

      set({ loading: true });
      const result = await fuelingOrderItemApi.getFuelingOrderItems(lazyParams);
      set({
        fuelingOrderitems: result,
        query: newQuery,
        loading: false,
      });
    },
    pageChange: async (page: number) => {
      await get().getFuelingOrderItems({ page });
    },
    loadAllForExport: async (): Promise<OrderItemEntity[]> => {
      const { query, fuelingOrderitems } = get();
      const totalCount = fuelingOrderitems?.count ?? 0;
      if (totalCount <= 0) return [];

      // If all items already on current page, return them
      if ((fuelingOrderitems?.items?.length ?? 0) >= totalCount) {
        return fuelingOrderitems!.items;
      }

      // Load ALL records matching current filters
      const lazyParams: LazyTableStateDTO<
        FuelingOrderFilter,
        FuelingOrderColumn
      > = {
        first: 0,
        rows: totalCount,
        page: 1,
        sort_field: query.sortField || "DCreated",
        sort_order: query.sortOrder || "Desc",
        filters: query.filters,
      };

      const result = await fuelingOrderItemApi.getFuelingOrderItems(lazyParams);
      return result.items;
    },
  })
);
