import { BaseApi } from "@/shared/api/base";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { TankDTO, TankEntity } from "../model/types";

class TankApi extends BaseApi {
  async getTanks(): Promise<TankEntity[]> {
    return this.request<TankEntity[]>("get_tanks");
  }

  async saveTank(tankDto: TankDTO): Promise<TankEntity> {
    return this.request<TankEntity>("save_tank", tankDto);
  }

  async deleteTank(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_tank", idDto);
  }
}

export const tankApi = new TankApi();
