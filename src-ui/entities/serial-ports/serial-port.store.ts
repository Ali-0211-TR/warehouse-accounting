import { create } from "zustand";
import { getSerialPorts } from "./serial-port.api";

interface SerialPortStoreState {
  ports: String[];
  getPorts: () => Promise<void>;
  getSavedPorts: () => Promise<void>;
}

export const useSerialPortStore = create<SerialPortStoreState>()(
  (set, get) => ({
    ports: [],
    getPorts: async () => {
      try {
        const result = await getSerialPorts();
        set({ ports: result });
      } catch (e) {
        set({ ports: [] });
      }
    },
    getSavedPorts: async () => {
      if (get().ports.length == 0) {
        const result = await getSerialPorts();
        set({ ports: result });
      }
    },
  }),
);
