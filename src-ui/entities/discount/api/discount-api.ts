import { BaseApi } from "@/shared/api/base";
import { DiscountDTO } from "@/shared/bindings/DiscountDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { DiscountEntity } from "../model/types";

class DiscountApi extends BaseApi {
  // Match Rust backend: list_discount
  async getDiscounts(): Promise<DiscountEntity[]> {
    return this.request<DiscountEntity[]>("get_discounts");
  }

  // Match Rust backend: save_discount with DiscountDTO
  async saveDiscount(discountDto: DiscountDTO): Promise<DiscountEntity> {
    return this.request<DiscountEntity>("save_discount", discountDto);
  }

  // Match Rust backend: delete_discount with IdDTO
  async deleteDiscount(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_discount", idDto);
  }
}

export const discountApi = new DiscountApi();
