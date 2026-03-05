import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { SortOrder } from "@/shared/bindings/SortOrder";
import {
  defaultPagination,
  PaginationInfo,
} from "@/shared/const/realworld.types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { contractApi } from "../api/contract-api";
import type {
  ContractDTO,
  ContractEntity,
  ContractFilterState,
  ContractLazyFilters,
  ContractSortField,
} from "./types";

interface ContractQueryData {
  first: number;
  rows: number;
  page: number;
  sortField?: ContractSortField;
  sortOrder?: SortOrder;
  filters?: ContractFilterState;
}

interface ContractStore {
  contracts: ContractEntity[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  query: ContractQueryData;

  loadContracts: (params?: Partial<ContractQueryData>) => Promise<void>;
  saveContract: (contract: ContractDTO) => Promise<ContractEntity>;
  deleteContract: (id: string) => Promise<void>;
  pageChange: (pageNum: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialContractQuery: ContractQueryData = {
  first: 0,
  rows: 25,
  page: 1,
  sortField: "Name",
  sortOrder: "Asc" as SortOrder,
  filters: {
    search: "",
    client_id: undefined,
    date_range: undefined,
  },
};

export const useContractStore = create<ContractStore>()(
  devtools(
    (set, get) => ({
      contracts: [],
      pagination: defaultPagination,
      loading: false,
      error: null,
      query: initialContractQuery,

      loadContracts: async (params?: Partial<ContractQueryData>) => {
        set({ loading: true, error: null });

        const currentQuery = get().query;
        const newQuery = { ...currentQuery, ...params };

        // If filters changed, reset to first page
        if (params?.filters) {
          newQuery.first = 0;
          newQuery.page = 1;
        }

        try {
          // Convert frontend filters to backend ContractFilter format
          const backendFilters: ContractLazyFilters = {
            id: null,
            device_id: null,
            client_id: newQuery.filters?.client_id || null,
            name: newQuery.filters?.search ? newQuery.filters.search : null,
            contract_name: null,
            d_begin:
              newQuery.filters?.date_range?.start &&
              newQuery.filters?.date_range?.end
                ? [
                    newQuery.filters.date_range.start,
                    newQuery.filters.date_range.end,
                  ]
                : null,
            d_end:
              newQuery.filters?.date_range?.start &&
              newQuery.filters?.date_range?.end
                ? [
                    newQuery.filters.date_range.start,
                    newQuery.filters.date_range.end,
                  ]
                : null,
          };

          // Create properly typed LazyTableStateDTO
          const lazyParams: LazyTableStateDTO<
            ContractLazyFilters,
            ContractSortField
          > = {
            first: newQuery.first,
            rows: newQuery.rows,
            page: newQuery.page,
            sort_field: newQuery.sortField || "Name",
            sort_order: newQuery.sortOrder || "Asc",
            filters: backendFilters,
          };

          const result = await contractApi.getContracts(lazyParams);

          set({
            contracts: result.items,
            pagination: { ...result },
            query: newQuery,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveContract: async (contractDto: ContractDTO) => {
        set({ loading: true, error: null });
        try {
          const savedContract = await contractApi.saveContract(contractDto);

          // Reload current page to reflect changes
          await get().loadContracts();

          return savedContract;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteContract: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await contractApi.deleteContract(id);

          // Reload current page to reflect changes
          await get().loadContracts();
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      pageChange: async (page: number) => {
        await get().loadContracts({ page });
      },
      clearError: () => set({ error: null }),

      reset: () =>
        set({
          contracts: [],
          pagination: defaultPagination,
          loading: false,
          error: null,
          query: initialContractQuery,
        }),
    }),
    { name: "contract-store" }
  )
);
