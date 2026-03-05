import { DispenserPortDTO } from "@/shared/bindings/DispenserPortDTO";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { dispenserPortApi } from "../api/dispenser-port-api";
import type { DispenserPortEntity } from "./types";

interface DispenserPortStore {
  // State
  dispenserPorts: DispenserPortEntity[];
  loading: boolean;
  error: string | null;

  // Actions
  loadDispenserPorts: () => Promise<void>;
  saveDispenserPort: (
    dispenserPort: DispenserPortDTO
  ) => Promise<DispenserPortEntity>;
  deleteDispenserPort: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDispenserPortStore = create<DispenserPortStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      dispenserPorts: [],
      loading: false,
      error: null,

      // Actions
      loadDispenserPorts: async () => {
        set({ loading: true, error: null });
        try {
          const dispenserPorts = await dispenserPortApi.getDispenserPorts();
          set({ dispenserPorts, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveDispenserPort: async (dispenserPort: DispenserPortDTO) => {
        set({ loading: true, error: null });
        try {
          const savedDispenserPort = await dispenserPortApi.saveDispenserPort(
            dispenserPort
          );
          const currentDispenserPorts = get().dispenserPorts;

          // Determine whether this is an update or a create based on the
          // incoming DTO's id. The backend will always return an id for
          // saved entities, so checking savedDispenserPort.id is not enough
          // to know if we should append or replace.
          const isUpdate = !!dispenserPort.id;

          const updatedDispenserPorts = isUpdate
            ? currentDispenserPorts.map(d =>
                d.id === savedDispenserPort.id ? savedDispenserPort : d
              )
            : [...currentDispenserPorts, savedDispenserPort];

          set({ dispenserPorts: updatedDispenserPorts, loading: false });
          return savedDispenserPort;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteDispenserPort: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await dispenserPortApi.deleteDispenserPort(id);
          const currentDispenserPorts = get().dispenserPorts;
          const updatedDispenserPorts = currentDispenserPorts.filter(
            d => d.id !== id
          );
          set({ dispenserPorts: updatedDispenserPorts, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "dispenser-port-store" }
  )
);
