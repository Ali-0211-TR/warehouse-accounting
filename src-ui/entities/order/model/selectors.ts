import type { OrderEntity, OrderItemEntity } from "./types";

export const orderSelectors = {
  sortOrders: (
    orders: OrderEntity[],
    sortBy: keyof OrderEntity = "d_created"
  ): OrderEntity[] => {
    return [...orders].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return bVal.localeCompare(aVal); // Most recent first
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal; // Highest first
      }

      return 0;
    });
  },

  getActiveOrders: (orders: OrderEntity[]): OrderEntity[] => {
    return orders.filter(order => !order.d_move && !order.discard);
  },

  getMovedOrders: (orders: OrderEntity[]): OrderEntity[] => {
    return orders.filter(order => !!order.d_move);
  },

  getDiscardedOrders: (orders: OrderEntity[]): OrderEntity[] => {
    return orders.filter(order => !!order.discard);
  },

  getOrdersByClient: (
    orders: OrderEntity[],
    clientId: string
  ): OrderEntity[] => {
    return orders.filter(order => order.client?.id === clientId);
  },

  getOrdersByType: (
    orders: OrderEntity[],
    orderType: string
  ): OrderEntity[] => {
    return orders.filter(order => order.order_type === orderType);
  },

  calculateOrderTotal: (order: OrderEntity): number => {
    return order.items.reduce((total, item) => total + item.cost, 0);
  },

  calculateOrderTax: (order: OrderEntity): number => {
    return order.items.reduce((total, item) => total + item.tax, 0);
  },

  getOrderItemsByProduct: (
    items: OrderItemEntity[],
    productId: string
  ): OrderItemEntity[] => {
    return items.filter(item => item.product?.id === productId);
  },
};
