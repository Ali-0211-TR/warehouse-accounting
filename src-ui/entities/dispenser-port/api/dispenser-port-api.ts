import { BaseApi } from "@/shared/api/base";
import { DispenserPortDTO } from "@/shared/bindings/DispenserPortDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { DispenserPortEntity } from "../model/types";

class DispenserPortApi extends BaseApi {
  async getDispenserPorts(): Promise<DispenserPortEntity[]> {
    return this.request<DispenserPortEntity[]>("get_dispenser_ports");
  }

  async saveDispenserPort(
    dispenserPort: DispenserPortDTO
  ): Promise<DispenserPortEntity> {
    return this.request<DispenserPortEntity>(
      "save_dispenser_port",
      dispenserPort
    );
  }

  async deleteDispenserPort(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_dispenser_port", idDto);
  }
}

export const dispenserPortApi = new DispenserPortApi();
