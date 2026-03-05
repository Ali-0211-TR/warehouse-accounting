import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { unitApi } from "../api/unit-api";
import type { UnitDTO, UnitEntity } from "./types";

interface UnitStore {
  units: UnitEntity[];
  loading: boolean;
  error: string | null;
  loadUnits: () => Promise<void>;
  saveUnit: (unit: UnitDTO) => Promise<UnitEntity>;
  deleteUnit: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useUnitStore = create<UnitStore>()(
  devtools(
    (set, get) => ({
      units: [],
      loading: false,
      error: null,

      loadUnits: async () => {
        set({ loading: true, error: null });
        try {
          const units = await unitApi.getUnits();
          set({ units, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveUnit: async (unitDto: UnitDTO) => {
        set({ loading: true, error: null });
        try {
          const savedUnit = await unitApi.saveUnit(unitDto);
          const currentUnits = get().units;

          const updatedUnits = unitDto.id
            ? currentUnits.map(u => (u.id === unitDto.id ? savedUnit : u))
            : [...currentUnits, savedUnit];

          set({ units: updatedUnits, loading: false });
          return savedUnit;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteUnit: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await unitApi.deleteUnit(id);
          const currentUnits = get().units;
          const updatedUnits = currentUnits.filter(u => u.id !== id);
          set({ units: updatedUnits, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "unit-store" }
  )
);
