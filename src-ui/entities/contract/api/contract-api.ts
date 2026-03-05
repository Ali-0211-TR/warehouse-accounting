import { BaseApi } from "@/shared/api/base";
import { ContractCarDTO } from "@/shared/bindings/ContractCarDTO";
import { ContractCarEntity } from "@/shared/bindings/ContractCarEntity";
import { ContractDTO } from "@/shared/bindings/ContractDTO";
import { ContractProductDTO } from "@/shared/bindings/ContractProductDTO";
import { ContractProductEntity } from "@/shared/bindings/ContractProductEntity";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { PaginatorDTO } from "@/shared/bindings/dtos/PaginatorDTO";
import {
  ContractEntity,
  ContractLazyFilters,
  ContractSortField,
} from "../model/types";

class ContractApi extends BaseApi {
  async getContracts(
    params: LazyTableStateDTO<ContractLazyFilters, ContractSortField>
  ): Promise<PaginatorDTO<ContractEntity>> {
    return this.request<PaginatorDTO<ContractEntity>>("get_contracts", params);
  }

  async saveContract(contractDto: ContractDTO): Promise<ContractEntity> {
    // Convert date strings to proper DateTime format for backend
    const processedDto = {
      ...contractDto,
      d_begin: this.convertToDateTime(contractDto.d_begin),
      d_end: this.convertToDateTime(contractDto.d_end),
    };

    return this.request<ContractEntity>("save_contract", processedDto);
  }

  async deleteContract(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_contract", idDto);
  }

  async getContractById(id: string): Promise<ContractEntity> {
    const idDto: IdDTO = { id };
    return this.request<ContractEntity>("get_contract_by_id", idDto);
  }

  async getContractCars(): Promise<ContractCarEntity[]> {
    return this.request<ContractCarEntity[]>("get_cars");
  }

  async saveContractCar(carDto: ContractCarDTO): Promise<ContractCarEntity> {
    return this.request<ContractCarEntity>("save_car", carDto);
  }

  async deleteContractCar(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_car", idDto);
  }

  async getContractProducts(): Promise<ContractProductEntity[]> {
    return this.request<ContractProductEntity[]>("get_contract_products");
  }

  async saveContractProduct(
    productDto: ContractProductDTO
  ): Promise<ContractProductEntity> {
    return this.request<ContractProductEntity>(
      "save_contract_product",
      productDto
    );
  }

  async deleteContractProduct(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_contract_product", idDto);
  }

  private convertToDateTime(dateString: string): string {
    if (!dateString) return dateString;

    // If already in ISO format, return as is
    if (dateString.includes("T")) return dateString;

    // Convert YYYY-MM-DD to full ISO datetime
    // For start date, use beginning of day
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${dateString}T00:00:00.000Z`;
    }

    return dateString;
  }
}

export const contractApi = new ContractApi();
