import { ContractCarDTO } from "@/shared/bindings/ContractCarDTO.ts";
import { create } from "zustand";
import { ContractCarEntity } from "../../shared/bindings/ContractCarEntity.ts";
import { updateOrInsertImmutable } from "../../shared/helpers/index.ts";
import { contractCarRepository } from "./repositories/IContractContractCarRepository.ts";

interface ContractCarStoreState {
  data: ContractCarEntity[];
  current: ContractCarEntity | null;
  loading: boolean;
  getCars: () => Promise<void>;
  saveCar: (newData: ContractCarDTO) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
}

export const useCarStore = create<ContractCarStoreState>(set => ({
  data: [],
  current: null,
  loading: false,
  getCars: async () => {
    set({ loading: true });
    try {
      const result = await contractCarRepository.getCars({});
      set({ data: result });
    } finally {
      set({ loading: false });
    }
  },
  saveCar: async (newData: ContractCarDTO) => {
    set({ loading: true });
    try {
      const result = await contractCarRepository.saveCar(newData);
      if (!result) {
        return;
      }

      set(state => ({
        data: updateOrInsertImmutable(state.data, result),
      }));
    } finally {
      set({ loading: false });
    }
  },
  deleteCar: async (id: string) => {
    set({ loading: true });
    try {
      await contractCarRepository.deleteCar(id);
      set(state => ({
        data: state.data.filter(item => item.id !== id),
      }));
    } finally {
      set({ loading: false });
    }
  },
}));
