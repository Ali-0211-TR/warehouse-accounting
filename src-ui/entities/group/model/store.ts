import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { groupApi } from "../api/group-api";
import type { GroupDTO, GroupEntity } from "./types";

interface GroupStore {
  groups: GroupEntity[];
  loading: boolean;
  error: string | null;
  loadGroups: () => Promise<void>;
  saveGroup: (group: GroupDTO) => Promise<GroupEntity>;
  deleteGroup: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useGroupStore = create<GroupStore>()(
  devtools(
    (set, get) => ({
      groups: [],
      loading: false,
      error: null,

      loadGroups: async () => {
        set({ loading: true, error: null });
        try {
          const groups = await groupApi.getGroups();
          set({ groups, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      saveGroup: async (groupDto: GroupDTO) => {
        set({ loading: true, error: null });
        try {
          const savedGroup = await groupApi.saveGroup(groupDto);
          const currentGroups = get().groups;

          const updatedGroups = groupDto.id
            ? currentGroups.map(g => (g.id === groupDto.id ? savedGroup : g))
            : [...currentGroups, savedGroup];

          set({ groups: updatedGroups, loading: false });
          return savedGroup;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteGroup: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await groupApi.deleteGroup(id);
          const currentGroups = get().groups;
          const updatedGroups = currentGroups.filter(g => g.id !== id);
          set({ groups: updatedGroups, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "group-store" }
  )
);
