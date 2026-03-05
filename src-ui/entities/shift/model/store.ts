import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { ShiftFilter } from "@/shared/bindings/ShiftFilter";
import { SortOrder } from "@/shared/bindings/SortOrder";
import {
  defaultPagination,
  PaginationInfo,
} from "@/shared/const/realworld.types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { shiftApi } from "../api/shift-api";
import type { ShiftEntity, ShiftFilterState, ShiftSortField } from "./types";

interface ShiftQueryData {
  first: number;
  rows: number;
  page: number;
  sortField?: ShiftSortField;
  sortOrder?: SortOrder;
  filters?: ShiftFilterState;
}

interface ShiftStore {
  shifts: ShiftEntity[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  query: ShiftQueryData;
  currentShift: ShiftEntity | null;
  setCurrentShift: (shift: ShiftEntity | null) => void;

  loadShifts: (params?: Partial<ShiftQueryData>) => Promise<void>;
  openShift: (shiftData: ShiftDTO) => Promise<ShiftEntity>;
  closeShift: (shiftData: ShiftDTO) => Promise<ShiftEntity>;
  deleteShift: (id: string) => Promise<void>;
  getCurrentShift: () => Promise<void>;
  pageChange: (pageNum: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;

}

const initialShiftQuery: ShiftQueryData = {
  first: 0,
  rows: 25,
  page: 1,
  sortField: "DOpen",
  sortOrder: "Desc" as SortOrder,
  filters: {
    search: "",
    user_id: undefined,
    date_range: undefined,
    is_open: undefined,
  },
};

export const useShiftStore = create<ShiftStore>()(
  devtools(
    (set, get) => ({
      shifts: [],
      pagination: defaultPagination,
      loading: false,
      error: null,
      query: initialShiftQuery,
      currentShift: null,
      setCurrentShift: (shift) => set({ currentShift: shift }),

      loadShifts: async (params?: Partial<ShiftQueryData>) => {
        set({ loading: true, error: null });

        const currentQuery = get().query;
        const newQuery = { ...currentQuery, ...params };

        // If filters changed, reset to first page
        if (params?.filters) {
          newQuery.first = 0;
          newQuery.page = 1;
        }

        try {
          // Convert frontend filters to backend ShiftFilter format
          const backendFilters: ShiftFilter = {
            id: newQuery.filters?.user_id || null,
            user_open_id: newQuery.filters?.user_id || null,
            user_close_id: null,
            d_open: newQuery.filters?.date_range
              ? [
                  newQuery.filters.date_range.start,
                  newQuery.filters.date_range.end,
                ]
              : null,
            d_close: null,
          };

          // Create properly typed LazyTableStateDTO
          const lazyParams: LazyTableStateDTO<ShiftFilter, ShiftSortField> = {
            first: newQuery.first,
            rows: newQuery.rows,
            page: newQuery.page,
            sort_field: newQuery.sortField || "DOpen",
            sort_order: newQuery.sortOrder || "Desc",
            filters: backendFilters,
          };

          const result = await shiftApi.getShifts(lazyParams);

          set({
            shifts: result.items,
            pagination: { ...result },
            query: newQuery,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      openShift: async (shiftData: ShiftDTO) => {
        set({ loading: true, error: null });
        try {
          const openedShift = await shiftApi.openShift(shiftData);
          // Update current shift and reload shifts
          set({ currentShift: openedShift });
          await get().loadShifts();

          return openedShift;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      closeShift: async (shiftData: ShiftDTO) => {
        set({ loading: true, error: null });
        try {
          const closedShift = await shiftApi.closeShift(shiftData);

          // Clear current shift and reload shifts
          set({ currentShift: null });
          await get().loadShifts();

          return closedShift;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteShift: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await shiftApi.deleteShift(id);

          // Reload current page to reflect changes
          await get().loadShifts();
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      getCurrentShift: async () => {
        try {
          const currentShift = await shiftApi.getCurrentShift();
          set({ currentShift });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      pageChange: async (page: number) => {
        await get().loadShifts({ page });
      },

      // setFilters: (filters: ShiftFilterState) => {
      //   get().loadShifts({ filters });
      // },

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          shifts: [],
          pagination: defaultPagination,
          loading: false,
          error: null,
          query: initialShiftQuery,
          currentShift: null,
        }),
    }),
    { name: "shift-store" }
  )
);
