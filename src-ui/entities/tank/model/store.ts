import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { tankApi } from "../api/tank-api";
import type { TankDTO, TankEntity } from "./types";

interface TankStore {
  // State
  tanks: TankEntity[];
  loading: boolean;
  error: string | null;

  // Actions
  loadTanks: () => Promise<void>;
  saveTank: (tank: TankDTO) => Promise<TankEntity>;
  deleteTank: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTankStore = create<TankStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      tanks: [],
      loading: false,
      error: null,

      // Actions
      loadTanks: async () => {
        set({ loading: true, error: null });
        try {
          const tanks = await tankApi.getTanks();
          set({ tanks, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveTank: async (tankDto: TankDTO) => {
        set({ loading: true, error: null });
        try {
          const savedTank = await tankApi.saveTank(tankDto);
          const currentTanks = get().tanks;

          const updatedTanks = tankDto.id
            ? currentTanks.map(t => (t.id === tankDto.id ? savedTank : t))
            : [...currentTanks, savedTank];

          set({ tanks: updatedTanks, loading: false });
          return savedTank;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteTank: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await tankApi.deleteTank(id);
          const currentTanks = get().tanks;
          const updatedTanks = currentTanks.filter(t => t.id !== id);
          set({ tanks: updatedTanks, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "tank-store" }
  )
);
