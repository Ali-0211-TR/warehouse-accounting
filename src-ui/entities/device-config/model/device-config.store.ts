import type { DeviceConfigEntity } from "@/shared/bindings/DeviceConfigEntity";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { deviceConfigApi } from "../api/device-config.api";

interface DeviceConfigStore {
  deviceConfig: DeviceConfigEntity | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDeviceConfig: () => Promise<void>;
  updateDeviceConfig: (config: Partial<DeviceConfigEntity>) => Promise<void>;
  registerDevice: (
    deviceName: string,
    serverUrl: string,
    companyName?: string
  ) => Promise<void>;
  reset: () => void;
}

const initialState = {
  deviceConfig: null,
  isLoading: false,
  error: null,
};

export const useDeviceConfigStore = create<DeviceConfigStore>()(
  devtools(
    set => ({
      ...initialState,

      fetchDeviceConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          const config = await deviceConfigApi.getDeviceConfig();
          set({ deviceConfig: config, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateDeviceConfig: async (config: Partial<DeviceConfigEntity>) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await deviceConfigApi.updateDeviceConfig(config);
          set({ deviceConfig: updated, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      registerDevice: async (
        deviceName: string,
        serverUrl: string,
        companyName?: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const config = await deviceConfigApi.registerDevice(
            deviceName,
            serverUrl,
            companyName
          );
          set({ deviceConfig: config, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      reset: () => set(initialState),
    }),
    { name: "DeviceConfigStore" }
  )
);
