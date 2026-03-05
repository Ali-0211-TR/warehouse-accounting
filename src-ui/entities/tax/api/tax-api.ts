import { BaseApi } from "@/shared/api/base";
import { TaxDTO } from "@/shared/bindings/TaxDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { TaxEntity } from "../model/types";

class TaxApi extends BaseApi {
  async getTaxes(): Promise<TaxEntity[]> {
    return this.request<TaxEntity[]>("get_taxes");
  }

  async saveTax(taxDto: TaxDTO): Promise<TaxEntity> {
    return this.request<TaxEntity>("save_tax", taxDto);
  }

  async deleteTax(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_tax", idDto);
  }
}

export const taxApi = new TaxApi();
