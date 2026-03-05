import { ContractProductDTO } from "@/shared/bindings/ContractProductDTO";
import { ContractProductEntity } from "../../../shared/bindings/ContractProductEntity";
import { DBContractProductRepository } from "./DatabaseContractProductRepository";

export interface IContractProductRepository {
  getContractProductById(id: string): Promise<ContractProductEntity>;
  getContractProducts(
    whereClause: Partial<ContractProductEntity>
  ): Promise<ContractProductEntity[]>;
  saveContractProduct(data: ContractProductDTO): Promise<ContractProductEntity>;
  deleteContractProduct(id: string): Promise<void>;
}

export let contractProductRepository = new DBContractProductRepository();
