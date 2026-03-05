import { BaseApi } from "@/shared/api/base";
import { FuelingSumaryMeta } from "@/shared/bindings/dtos/FuelingSumaryMeta";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { MetaPaginatorDTO } from "@/shared/bindings/dtos/MetaPaginatorDTO";
import { FuelingOrderColumn } from "@/shared/bindings/FuelingOrderColumn";
import { FuelingOrderFilter } from "@/shared/bindings/FuelingOrderFilter";
import { OrderItemEntity } from "@/shared/bindings/OrderItemEntity";

class FuelingOrderItemApi extends BaseApi {
  async getFuelingOrderItems(
    params: LazyTableStateDTO<FuelingOrderFilter, FuelingOrderColumn>
  ): Promise<MetaPaginatorDTO<OrderItemEntity, FuelingSumaryMeta>> {
    return this.request<MetaPaginatorDTO<OrderItemEntity, FuelingSumaryMeta>>(
      "get_fueling_order_items",
      params
    );
  }
}

export const fuelingOrderItemApi = new FuelingOrderItemApi();
