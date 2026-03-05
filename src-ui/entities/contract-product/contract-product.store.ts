import { ContractProductDTO } from "@/shared/bindings/ContractProductDTO.ts";
import { create } from "zustand";
import { ContractProductEntity } from "../../shared/bindings/ContractProductEntity.ts";
import { updateOrInsertImmutable } from "../../shared/helpers/index.ts";
import { contractProductRepository } from "./repositories/IContractProductRepository.ts";

interface ContractProductStoreState {
  data: ContractProductEntity[];
  loading: boolean;
  getContractProducts: () => Promise<void>;
  saveContractProduct: (newData: ContractProductDTO) => Promise<void>;
  deleteContractProduct: (id: string) => Promise<void>;
}

export const useContractProductStore = create<ContractProductStoreState>(
  set => ({
    data: [],
    loading: false,
    getContractProducts: async () => {
      set({ loading: true });
      try {
        const result = await contractProductRepository.getContractProducts({});
        set({ data: result });
      } finally {
        set({ loading: false });
      }
    },
    saveContractProduct: async (newData: ContractProductDTO) => {
      set({ loading: true });
      try {
        const result = await contractProductRepository.saveContractProduct(
          newData
        );
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
    deleteContractProduct: async (id: string) => {
      set({ loading: true });
      try {
        await contractProductRepository.deleteContractProduct(id);
        set(state => ({
          data: state.data.filter(item => item.id !== id),
        }));
      } finally {
        set({ loading: false });
      }
    },
  })
);
