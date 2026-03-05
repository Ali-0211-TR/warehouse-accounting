import { ProductEntity } from "@/entities/product";
import { BaseApi } from "@/shared/api/base";
import { AddProductDTO } from "@/shared/bindings/dtos/AddProductDTO";
import { CloseOrderDTO } from "@/shared/bindings/dtos/CloseOrderDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import { MetaPaginatorDTO } from "@/shared/bindings/dtos/MetaPaginatorDTO";
import { OrderMovementSummaryMeta } from "@/shared/bindings/dtos/OrderMovementSummaryMeta";
import { PaginatorDTO } from "@/shared/bindings/dtos/PaginatorDTO";
import { RemoveOrderItemDTO } from "@/shared/bindings/dtos/RemoveOrderItemDTO";
import {
  OrderEntity,
  OrderItemEntity,
  OrderLazyFilters,
  OrderSortField,
} from "../model/types";
import { SetOrderClientDTO } from "@/shared/bindings/dtos/SetOrderClientDTO";

class OrderApi extends BaseApi {
  async getOrders(
    params: LazyTableStateDTO<OrderLazyFilters, OrderSortField>
  ): Promise<PaginatorDTO<OrderEntity>> {
    return this.request<PaginatorDTO<OrderEntity>>("get_orders", params);
  }

  async getMovementReport(
    params: LazyTableStateDTO<OrderLazyFilters, OrderSortField>
  ): Promise<MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>> {
    return this.request<
      MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>
    >("get_movement_report", params);
  }

  async getOneDispenserHistory(
    dispenserId: string,
    limit: number = 15
  ): Promise<OrderEntity[]> {
    return this.request<OrderEntity[]>("get_history_orders", {
      dispenser_id: dispenserId,
      limit: limit,
    });
  }
  async getActiveOrders(): Promise<OrderEntity[]> {
    return this.request<OrderEntity[]>("get_active_orders");
  }

  async closeActiveOrder(closeOrderDto: CloseOrderDTO): Promise<OrderEntity> {
    return this.request<OrderEntity>("close_active_order", closeOrderDto);
  }
  async closeFueling(id: string): Promise<OrderEntity> {
    const idDto: IdDTO = { id };
    return this.request<OrderEntity>("close_fueling", idDto);
  }

  async addIncomeOrder(id: string): Promise<string> {
    const idDto: IdDTO = { id };
    return this.request<string>("add_income_order", idDto);
  }

  async addSaleOrder(id?: string): Promise<string> {
    const optionIdDto = { id: id ?? null };
    return this.request<string>("add_sale_order", optionIdDto);
  }

  async addReturnOrder(id?: string): Promise<string> {
    const optionIdDto = { id: id ?? null };
    return this.request<string>("add_return_order", optionIdDto);
  }

  async addOutcomeOrder(id?: string): Promise<string> {
    const optionIdDto = { id: id ?? null };
    return this.request<string>("add_outcome_order", optionIdDto);
  }

  async deleteOrder(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_order", idDto);
  }

  // Order Items API
  async addOrderItem(
    orderItemDto: AddProductDTO
  ): Promise<[OrderEntity, ProductEntity]> {
    // The backend returns (OrderEntity, ProductEntity)
    return this.request<[OrderEntity, ProductEntity]>(
      "add_item_to_order",
      orderItemDto
    );
  }

    async setActiveOrderClient(orderId: string, clientId: string | null): Promise<OrderEntity> {
    const dto: SetOrderClientDTO = {
      order_id: orderId,
      client_id: clientId,
    };

    // Команда на бекенде должна называться так:
    // "set_active_order_client"
    return this.request<OrderEntity>("set_active_order_client", dto);
  }


  // async updateOrderItem(orderItemDto: OrderItemDTO): Promise<OrderItemEntity> {
  //   return this.request<OrderItemEntity>("update_order_item", orderItemDto);
  // }

  async removeOrderItem(
    orderId: string,
    orderItemId: string
  ): Promise<OrderEntity> {
    const removeDto: RemoveOrderItemDTO = {
      order_id: orderId,
      order_item_id: orderItemId,
    };
    return this.request<OrderEntity>("remove_order_item", removeDto);
  }

  async getOrderItems(orderId: string): Promise<OrderItemEntity[]> {
    const orderIdDto = { order_id: orderId };
    return this.request<OrderItemEntity[]>("get_order_items", orderIdDto);
  }

  async moveOrder(id: string): Promise<OrderEntity> {
    const idDto: IdDTO = { id };
    return this.request<OrderEntity>("move_order", idDto);
  }

  async discardOrder(id: string, reason?: string): Promise<OrderEntity> {
    const discardDto = { id, reason: reason || null };
    return this.request<OrderEntity>("discard_order", discardDto);
  }
}

export const orderApi = new OrderApi();
