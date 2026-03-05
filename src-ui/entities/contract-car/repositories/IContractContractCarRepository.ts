import { ContractCarDTO } from "@/shared/bindings/ContractCarDTO";
import { ContractCarEntity } from "../../../shared/bindings/ContractCarEntity";
import { DBContractCarRepository } from "./DatabaseContractCarRepository";

export interface IContractCarRepository {
  getCarById(id: string): Promise<ContractCarEntity>;
  getCars(
    whereClause: Partial<ContractCarEntity>
  ): Promise<ContractCarEntity[]>;
  saveCar(data: ContractCarDTO): Promise<ContractCarEntity>;
  deleteCar(id: string): Promise<void>;
}

export let contractCarRepository = new DBContractCarRepository();
