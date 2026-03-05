import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { discountApi } from "../api/discount-api";
import type { DiscountDTO, DiscountEntity } from "./types";

interface DiscountStore {
  // State
  discounts: DiscountEntity[];
  loading: boolean;
  error: string | null;

  // Actions
  loadDiscounts: () => Promise<void>;
  saveDiscount: (discount: DiscountDTO) => Promise<DiscountEntity>;
  deleteDiscount: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDiscountStore = create<DiscountStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      discounts: [],
      loading: false,
      error: null,

      // Actions
      loadDiscounts: async () => {
        set({ loading: true, error: null });
        try {
          const discounts = await discountApi.getDiscounts();
          set({ discounts, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveDiscount: async (discountDto: DiscountDTO) => {
        set({ loading: true, error: null });
        try {
          const savedDiscount = await discountApi.saveDiscount(discountDto);
          const currentDiscounts = get().discounts;

          const updatedDiscounts = discountDto.id
            ? currentDiscounts.map(d =>
                d.id === discountDto.id ? savedDiscount : d
              )
            : [...currentDiscounts, savedDiscount];

          set({ discounts: updatedDiscounts, loading: false });
          return savedDiscount;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteDiscount: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await discountApi.deleteDiscount(id);
          const currentDiscounts = get().discounts;
          const updatedDiscounts = currentDiscounts.filter(d => d.id !== id);
          set({ discounts: updatedDiscounts, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "discount-store" }
  )
);
