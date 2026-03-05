import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { cameraApi } from "../api/camera-api";
import type { CameraDTO, CameraEntity } from "./types";

interface CameraStore {
  cameras: CameraEntity[];
  loading: boolean;
  error: string | null;
  loadCameras: () => Promise<void>;
  saveCamera: (camera: CameraDTO) => Promise<CameraEntity>;
  deleteCamera: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCameraStore = create<CameraStore>()(
  devtools(
    (set, get) => ({
      cameras: [],
      loading: false,
      error: null,

      loadCameras: async () => {
        set({ loading: true, error: null });
        try {
          const cameras = await cameraApi.getCameras();
          set({ cameras, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveCamera: async (cameraDto: CameraDTO) => {
        set({ loading: true, error: null });
        try {
          const savedCamera = await cameraApi.saveCamera(cameraDto);
          const currentCameras = get().cameras;

          const updatedCameras = cameraDto.id
            ? currentCameras.map(c => (c.id === cameraDto.id ? savedCamera : c))
            : [...currentCameras, savedCamera];

          set({ cameras: updatedCameras, loading: false });
          return savedCamera;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteCamera: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await cameraApi.deleteCamera(id);
          const currentCameras = get().cameras;
          const updatedCameras = currentCameras.filter(c => c.id !== id);
          set({ cameras: updatedCameras, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "camera-store" }
  )
);
