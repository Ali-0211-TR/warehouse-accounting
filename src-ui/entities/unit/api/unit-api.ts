import { BaseApi } from "@/shared/api/base";
import { UnitDTO } from "@/shared/bindings/UnitDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { UnitEntity } from "../model/types";

class UnitApi extends BaseApi {
  async getUnits(): Promise<UnitEntity[]> {
    return this.request<UnitEntity[]>("get_units");
  }

  async saveUnit(unitDto: UnitDTO): Promise<UnitEntity> {
    return this.request<UnitEntity>("save_unit", unitDto);
  }

  async deleteUnit(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_unit", idDto);
  }
}

export const unitApi = new UnitApi();
