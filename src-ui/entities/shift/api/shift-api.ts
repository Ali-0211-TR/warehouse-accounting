import { BaseApi } from "@/shared/api/base";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { PaginatorDTO } from "@/shared/bindings/dtos/PaginatorDTO";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { ShiftEntity, ShiftLazyFilters, ShiftSortField } from "../model/types";

class ShiftApi extends BaseApi {
  async getShifts(
    params: LazyTableStateDTO<ShiftLazyFilters, ShiftSortField>
  ): Promise<PaginatorDTO<ShiftEntity>> {
    return this.request<PaginatorDTO<ShiftEntity>>("get_shifts", params);
  }

  async openShift(params: ShiftDTO): Promise<ShiftEntity> {
    return this.request<ShiftEntity>("open_shift", params);
  }

  async closeShift(params: ShiftDTO): Promise<ShiftEntity> {
    return this.request<ShiftEntity>("close_shift", params);
  }

  async deleteShift(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_shift", idDto);
  }

  async getCurrentShift(): Promise<ShiftEntity | null> {
    return this.request<ShiftEntity | null>("get_current_shift");
  }
}

export const shiftApi = new ShiftApi();
