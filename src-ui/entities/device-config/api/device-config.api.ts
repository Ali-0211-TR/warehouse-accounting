import type { DeviceConfigEntity } from "@/shared/bindings/DeviceConfigEntity";
import { invoke } from "@tauri-apps/api/core";

export const deviceConfigApi = {
  /**
   * Get device configuration
   */
  async getDeviceConfig(): Promise<DeviceConfigEntity> {
    return await invoke<DeviceConfigEntity>("get_device_config");
  },

  /**
   * Update device configuration
   */
  async updateDeviceConfig(
    config: Partial<DeviceConfigEntity>
  ): Promise<DeviceConfigEntity> {
    return await invoke<DeviceConfigEntity>("update_device_config", { config });
  },

  /**
   * Register device
   */
  async registerDevice(
    deviceName: string,
    serverUrl: string,
    companyName?: string
  ): Promise<DeviceConfigEntity> {
    return await invoke<DeviceConfigEntity>("register_device", {
      deviceName,
      serverUrl,
      companyName,
    });
  },
};
