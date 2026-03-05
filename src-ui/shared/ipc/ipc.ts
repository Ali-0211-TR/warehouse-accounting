import { invoke } from "@tauri-apps/api/core";
import { deepFreeze } from "utils-min";

export async function ipc_invoke(
  method: string,
  params?: object
): Promise<any> {
  try {
    const response: any = await invoke(method, { params });
    if (response.error) {
      const errorMessage = response.error.message ?? "Unknown error";
      throw new Error(errorMessage);
    }
    return deepFreeze(response.result.data);
  } catch (error: any) {
    console.error("Error invoking Tauri method:", error);
    const errorMessage = error;
    throw new Error(errorMessage);
  }
}
