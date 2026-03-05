import { create } from "zustand";
import { GroupEntity } from "../../shared/bindings/GroupEntity.ts";
import { updateOrInsertImmutable } from "../../shared/helpers/index.ts";
import { groupRepository } from "./repositories/IGroupRepository.ts";

interface GroupStoreState {
  groups: GroupEntity[];
  current: GroupEntity | null;
  loading: boolean;
  getGroups: () => Promise<void>;
  saveGroup: (newData: GroupEntity) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useGroupStore = create<GroupStoreState>((set, get) => ({
  groups: [],
  current: null,
  loading: false,
  getGroups: async () => {
    set({ loading: true });
    try {
      if (get().groups.length === 0) {
        const result = await groupRepository.getGroups({});
        set({ groups: result });
      }
    } finally {
      set({ loading: false });
    }
  },
  saveGroup: async (newData: GroupEntity) => {
    set({ loading: true });
    try {
      const result = await groupRepository.saveGroup(newData);
      if (!result) {
        return;
      }

      set(state => ({
        groups: updateOrInsertImmutable(state.groups, result),
      }));
    } finally {
      set({ loading: false });
    }
  },

  deleteGroup: async (id: string) => {
    set({ loading: true });
    try {
      await groupRepository.deleteGroup(id);
      set(state => ({
        groups: state.groups.filter(item => item.id !== id),
      }));
    } finally {
      set({ loading: false });
    }
  },
}));
