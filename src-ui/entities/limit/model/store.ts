import type { LimitEntity } from "@/shared/bindings/LimitEntity";
import type { LimitDTO } from "@/shared/bindings/dtos/LimitDTO";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { limitApi } from "../api/limit-api";

interface LimitStore {
  limits: LimitEntity[];
  loading: boolean;
  error: string | null;

  loadLimitsByCardId: (card_id: string) => Promise<void>;
  saveLimit: (limitDto: LimitDTO) => Promise<void>;
  deleteLimit: (id: string) => Promise<void>;
  clearLimits: () => void;
}

export const useLimitStore = create<LimitStore>()(
  devtools(
    (set, get) => ({
      limits: [],
      loading: false,
      error: null,

      loadLimitsByCardId: async (card_id: string) => {
        set({ loading: true, error: null });
        try {
          const limits = await limitApi.getLimitsByCardId(card_id);
          set({ limits, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveLimit: async (limitDto: LimitDTO) => {
        set({ loading: true, error: null });
        try {
          const savedLimit = await limitApi.saveLimit(limitDto);
          const currentLimits = get().limits;

          const updatedLimits = limitDto.id
            ? currentLimits.map(limit =>
                limit.id === limitDto.id ? savedLimit : limit
              )
            : [...currentLimits, savedLimit];

          set({ limits: updatedLimits, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteLimit: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await limitApi.deleteLimit(id);
          set(state => ({
            limits: state.limits.filter(limit => limit.id !== id),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearLimits: () => {
        set({ limits: [], error: null });
      },
    }),
    { name: "LimitStore" }
  )
);
