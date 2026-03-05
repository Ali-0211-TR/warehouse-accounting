import { ContractProductDTO } from "@/shared/bindings/ContractProductDTO";
import { ContractProductEntity } from "../../../shared/bindings/ContractProductEntity";
import { ipc_invoke } from "../../../shared/ipc/ipc";
import { IContractProductRepository } from "./IContractProductRepository";

export class DBContractProductRepository implements IContractProductRepository {
  async getContractProductById(_id: string): Promise<ContractProductEntity> {
    throw new Error("Method not implemented.");
  }
  async getContractProducts(
    _whereClause: Partial<ContractProductEntity>
  ): Promise<ContractProductEntity[]> {
    const result: ContractProductEntity[] = await ipc_invoke(
      "get_contract_products"
    );
    return result;
  }
  async saveContractProduct(
    data: ContractProductDTO
  ): Promise<ContractProductEntity> {
    const result: ContractProductEntity = await ipc_invoke(
      "save_contract_product",
      data
    );
    return result;
  }

  async deleteContractProduct(id: string): Promise<void> {
    const result = await ipc_invoke("delete_contract_product", { id });
    return result;
  }
}
