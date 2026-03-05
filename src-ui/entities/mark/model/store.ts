import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { markApi } from "../api/mark-api";
import type { MarkDTO, MarkEntity } from "./types";

interface MarkStore {
  marks: MarkEntity[];
  loading: boolean;
  error: string | null;
  loadMarks: () => Promise<void>;
  saveMark: (mark: MarkDTO) => Promise<MarkEntity>;
  deleteMark: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useMarkStore = create<MarkStore>()(
  devtools(
    (set, get) => ({
      marks: [],
      loading: false,
      error: null,

      loadMarks: async () => {
        set({ loading: true, error: null });
        try {
          const marks = await markApi.getMarks();
          set({ marks, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveMark: async (markDto: MarkDTO) => {
        set({ loading: true, error: null });
        try {
          const savedMark = await markApi.saveMark(markDto);
          const currentMarks = get().marks;

          const updatedMarks = markDto.id
            ? currentMarks.map(m => (m.id === markDto.id ? savedMark : m))
            : [...currentMarks, savedMark];

          set({ marks: updatedMarks, loading: false });
          return savedMark;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteMark: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await markApi.deleteMark(id);
          const currentMarks = get().marks;
          const updatedMarks = currentMarks.filter(m => m.id !== id);
          set({ marks: updatedMarks, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "mark-store" }
  )
);
