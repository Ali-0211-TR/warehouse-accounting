import { ContractCarDTO } from "@/shared/bindings/ContractCarDTO";
import { ContractCarEntity } from "../../../shared/bindings/ContractCarEntity";
import { ipc_invoke } from "../../../shared/ipc/ipc";
import { IContractCarRepository } from "./IContractContractCarRepository";

export class DBContractCarRepository implements IContractCarRepository {
  async getCarById(_id: string): Promise<ContractCarEntity> {
    throw new Error("Method not implemented.");
  }
  async getCars(
    _whereClause: Partial<ContractCarEntity>
  ): Promise<ContractCarEntity[]> {
    const result: ContractCarEntity[] = await ipc_invoke("get_cars");
    return result;
  }
  async saveCar(data: ContractCarDTO): Promise<ContractCarEntity> {
    const result: ContractCarEntity = await ipc_invoke("save_car", data);
    return result;
  }

  async deleteCar(id: string): Promise<void> {
    const result = await ipc_invoke("delete_car", { id });
    return result;
  }
}
