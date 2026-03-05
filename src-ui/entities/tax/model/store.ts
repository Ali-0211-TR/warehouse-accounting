import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { taxApi } from "../api/tax-api";
import type { TaxDTO, TaxEntity } from "./types";

interface TaxStore {
  taxes: TaxEntity[];
  loading: boolean;
  error: string | null;
  loadTaxes: () => Promise<void>;
  saveTax: (tax: TaxDTO) => Promise<TaxEntity>;
  deleteTax: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTaxStore = create<TaxStore>()(
  devtools(
    (set, get) => ({
      taxes: [],
      loading: false,
      error: null,

      loadTaxes: async () => {
        set({ loading: true, error: null });
        try {
          const taxes = await taxApi.getTaxes();
          set({ taxes, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveTax: async (taxDto: TaxDTO) => {
        set({ loading: true, error: null });
        try {
          const savedTax = await taxApi.saveTax(taxDto);
          const currentTaxes = get().taxes;

          const updatedTaxes = taxDto.id
            ? currentTaxes.map(t => (t.id === taxDto.id ? savedTax : t))
            : [...currentTaxes, savedTax];

          set({ taxes: updatedTaxes, loading: false });
          return savedTax;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteTax: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await taxApi.deleteTax(id);
          const currentTaxes = get().taxes;
          const updatedTaxes = currentTaxes.filter(t => t.id !== id);
          set({ taxes: updatedTaxes, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "tax-store" }
  )
);
