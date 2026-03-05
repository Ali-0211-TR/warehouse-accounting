import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { cardApi } from "../api/card-api";
import type { CardEntity } from "./types";

interface CardStoreState {
  data: CardEntity[];
  current: CardEntity | null;
  loading: boolean;
  error: string | null;
  getCards: () => Promise<void>;
  getCardsByClientId: (
    client_id: string,
    include_limits?: boolean
  ) => Promise<CardEntity[]>;
  getCardById: (id: string, include_nested?: boolean) => Promise<CardEntity>;
  saveCard: (newData: CardEntity) => Promise<CardEntity>;
  deleteCard: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCardStore = create<CardStoreState>()(
  devtools(set => ({
    data: [],
    current: null,
    loading: false,
    error: null,

    getCards: async () => {
      set({ loading: true, error: null });
      try {
        const result = await cardApi.getCards();
        set({ data: result });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch cards";
        set({ error: errorMessage });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    getCardsByClientId: async (client_id: string, include_limits = true) => {
      set({ loading: true, error: null });
      try {
        const result = await cardApi.getCardsByClientId(
          client_id,
          include_limits
        );
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch cards by client";
        set({ error: errorMessage });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    getCardById: async (id: string, include_nested = false) => {
      set({ loading: true, error: null });
      try {
        const result = await cardApi.getCardById(id, include_nested);
        set({ current: result });
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch card";
        set({ error: errorMessage });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    saveCard: async (newData: CardEntity) => {
      set({ loading: true, error: null });
      try {
        const result = await cardApi.saveCard(newData);
        set(state => ({
          data: state.data.some(item => item.id === result.id)
            ? state.data.map(item => (item.id === result.id ? result : item))
            : [...state.data, result],
        }));
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save card";
        set({ error: errorMessage });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    deleteCard: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await cardApi.deleteCard(id);
        set(state => ({
          data: state.data.filter(item => item.id !== id),
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete card";
        set({ error: errorMessage });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    clearError: () => set({ error: null }),
  }))
);
