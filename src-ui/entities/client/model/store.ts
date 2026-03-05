import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { SortOrder } from "@/shared/bindings/SortOrder";
import {
  defaultPagination,
  PaginationInfo,
} from "@/shared/const/realworld.types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { clientApi } from "../api/client-api";
import type {
  ClientDTO,
  ClientEntity,
  ClientFilterState,
  ClientLazyFilters,
  ClientSortField,
} from "./types";

interface ClientQueryData {
  first: number;
  rows: number;
  page: number;
  sortField?: ClientSortField;
  sortOrder?: SortOrder;
  filters?: ClientFilterState;
}

interface ClientStore {
  clients: ClientEntity[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  query: ClientQueryData;

  loadClients: (params?: Partial<ClientQueryData>) => Promise<void>;
  saveClient: (client: ClientDTO) => Promise<ClientEntity>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Promise<ClientEntity>;
  pageChange: (pageNum: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialClientQuery: ClientQueryData = {
  first: 0,
  rows: 25,
  page: 1,
  sortField: "Name",
  sortOrder: "Asc" as SortOrder,
  filters: {
    search: "",
    client_type: undefined,
    has_tax_code: undefined,
  },
};

export const useClientStore = create<ClientStore>()(
  devtools(
    (set, get) => ({
      clients: [],
      pagination: defaultPagination,
      loading: false,
      error: null,
      query: initialClientQuery,

      loadClients: async (params?: Partial<ClientQueryData>) => {
        set({ loading: true, error: null });

        const currentQuery = get().query;
        const newQuery = { ...currentQuery, ...params };

        // If filters changed, reset to first page
        if (params?.filters) {
          newQuery.first = 0;
          newQuery.page = 1;
        }

        try {
          // Convert frontend filters to backend ClientFilter format
          const backendFilters: ClientLazyFilters = {
            id: null,
            device_id: null,
            name: newQuery.filters?.search ? newQuery.filters.search : null,
            name_short: null,
            client_type: newQuery.filters?.client_type || null,
            document_code: null,
            address: null,
            tax_code:
              newQuery.filters?.has_tax_code === true
                ? "not_null"
                : newQuery.filters?.has_tax_code === false
                ? null
                : null,
          };

          // Create properly typed LazyTableStateDTO
          const lazyParams: LazyTableStateDTO<
            ClientLazyFilters,
            ClientSortField
          > = {
            first: newQuery.first,
            rows: newQuery.rows,
            page: newQuery.page,
            sort_field: newQuery.sortField || "Name",
            sort_order: newQuery.sortOrder || "Asc",
            filters: backendFilters,
          };

          const result = await clientApi.getClients(lazyParams);

          set({
            clients: result.items,
            pagination: { ...result },
            query: newQuery,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      getClientById: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const client = await clientApi.getClientById(id);
          set({ loading: false });
          return client;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      saveClient: async (clientDto: ClientDTO) => {
        set({ loading: true, error: null });
        try {
          const savedClient = await clientApi.saveClient(clientDto);

          // Reload current page to reflect changes
          await get().loadClients();

          return savedClient;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteClient: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await clientApi.deleteClient(id);

          // Reload current page to reflect changes
          await get().loadClients();
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      pageChange: async (page: number) => {
        await get().loadClients({ page });
      },

      setFilters: (filters: ClientFilterState) => {
        get().loadClients({ filters });
      },

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          clients: [],
          pagination: defaultPagination,
          loading: false,
          error: null,
          query: initialClientQuery,
        }),
    }),
    { name: "client-store" }
  )
);
