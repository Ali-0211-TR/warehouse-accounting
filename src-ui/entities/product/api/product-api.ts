import { BaseApi } from "@/shared/api/base";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { ProductInputDTO } from "@/shared/bindings/dtos/ProductInputDTO";
import { ProductMovementFilter } from "@/shared/bindings/dtos/ProductMovementFilter";
import { ProductMovementReport } from "@/shared/bindings/dtos/ProductMovementReport";
import { PriceDTO } from "@/shared/bindings/PriceDTO";
import { PriceEntity } from "@/shared/bindings/PriceEntity";
import type { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import type { PaginatorDTO } from "@/shared/bindings/dtos/PaginatorDTO";
import type { ProductColumn } from "@/shared/bindings/dtos/ProductColumn";
import type { ProductFilter } from "@/shared/bindings/dtos/ProductFilter";
import { ProductEntity } from "../model/types";

class ProductApi extends BaseApi {
  async getProducts(): Promise<ProductEntity[]> {
    return this.request<ProductEntity[]>("get_products");
  }

  async getProductsPaginated(
    params: LazyTableStateDTO<ProductFilter, ProductColumn>,
  ): Promise<PaginatorDTO<ProductEntity>> {
    return this.request<PaginatorDTO<ProductEntity>>("get_products_paginated", params);
  }

  async getAllProducts(): Promise<ProductEntity[]> {
    return this.request<ProductEntity[]>("get_all_products");
  }

  async saveProduct(productDto: ProductInputDTO): Promise<ProductEntity> {
    return this.request<ProductEntity>("save_product", productDto);
  }

  async deleteProduct(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<string>("delete_product", idDto);
  }

  async restoreProduct(id: string): Promise<ProductEntity> {
    const idDto: IdDTO = { id };
    return this.request<ProductEntity>("restore_product", idDto);
  }

  async calculateBalance(productId: string): Promise<void> {
    const idDto: IdDTO = { id: productId };
    await this.request<void>("calculate_product_balance", idDto);
  }

  async calculateAllBalances(): Promise<void> {
    await this.request<void>("calc_all_product_balance");
  }

  // Price manipulation functions
  async savePrice(priceDto: PriceDTO): Promise<PriceEntity> {
    return this.request<PriceEntity>("save_price", priceDto);
  }

  async getPrices(productId: string): Promise<PriceEntity[]> {
    const idDto: IdDTO = { id: productId };
    return this.request<PriceEntity[]>("get_prices", idDto);
  }

  async deletePrice(priceEntity: PriceEntity): Promise<number> {
    return this.request<number>("delete_price", priceEntity);
  }

  async getProductMovementReport(filter: ProductMovementFilter): Promise<ProductMovementReport> {
    return this.request<ProductMovementReport>("get_product_movement_report", filter);
  }
}

export const productApi = new ProductApi();
