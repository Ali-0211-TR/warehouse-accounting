import { invoke } from "@tauri-apps/api/core";

export abstract class BaseApi {
  protected async request<T>(
    command: string,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const response: any = await invoke(command, { params });

      // Handle error response from backend
      if (response.error) {
        const errorMessage = response.error.message ?? "Unknown error";
        throw new Error(errorMessage);
      }

      return response.result.data as T;
    } catch (error: any) {
      console.error(`API Error [${command}]:`, error);

      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }

      // Otherwise create a new Error with the message
      const errorMessage = error?.message || error || "Unknown API error";
      throw new Error(errorMessage);
    }
  }

  // Alternative method for simple invoke without params wrapping
  protected async simpleRequest<T>(
    command: string,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const response: any = await invoke(command, { params });

      // Handle error response from backend (same as request method)
      if (response && typeof response === "object" && response.error) {
        const errorMessage = response.error.message ?? "Unknown error";
        throw new Error(errorMessage);
      }

      // For simple request, if there's a result field, return it, otherwise return the whole response
      if (response && typeof response === "object" && "result" in response) {
        return response.result as T;
      }

      return response as T;
    } catch (error: any) {
      console.error(`API Error [${command}]:`, error);

      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }

      const errorMessage = error?.message || error || "Unknown API error";
      throw new Error(errorMessage);
    }
  }
}
