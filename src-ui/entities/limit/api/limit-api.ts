import type { LimitEntity } from "@/shared/bindings/LimitEntity";
import type { LimitDTO } from "@/shared/bindings/dtos/LimitDTO";
import { ipc_invoke } from "@/shared/ipc/ipc";

export const limitApi = {
  getLimitsByCardId: async (card_id: string): Promise<LimitEntity[]> => {
    return await ipc_invoke("get_limits_by_card_id", { id: card_id });
  },

  getLimitById: async (id: string): Promise<LimitEntity> => {
    return await ipc_invoke("get_limit_by_id", { id });
  },

  saveLimit: async (limit: LimitDTO): Promise<LimitEntity> => {
    return await ipc_invoke("save_limit", limit);
  },

  deleteLimit: async (id: string): Promise<void> => {
    await ipc_invoke("delete_limit", { id });
  },
};
