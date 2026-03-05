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

  getOrdersByContract: (
    orders: OrderEntity[],
    contractId: string
  ): OrderEntity[] => {
    return orders.filter(order => order.contract?.id === contractId);
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

  // Dispenser-specific selectors for performance optimization
  getActiveOrderByDispenserId: (
    orders: OrderEntity[],
    _dispenserId: string,
    nozzleIds: string[]
  ): OrderEntity | null => {
    return (
      orders.find(order => {
        if (!order.fueling_order_item_id) return false;
        const fuelingOrderItem = order.items.find(
          item => item.id === order.fueling_order_item_id
        );
        return (
          fuelingOrderItem?.fueling_order?.nozzle_id != null &&
          nozzleIds.includes(fuelingOrderItem.fueling_order.nozzle_id)
        );
      }) || null
    );
  },

  getFuelingOrderByDispenserId: (
    orders: OrderEntity[],
    dispenserId: string,
    nozzleIds: string[]
  ) => {
    const activeOrder = orderSelectors.getActiveOrderByDispenserId(
      orders,
      dispenserId,
      nozzleIds
    );
    if (activeOrder && "items" in activeOrder) {
      const { fueling_order_item_id, items } = activeOrder;
      const orderItem = items.find(item => item.id === fueling_order_item_id);
      return orderItem?.fueling_order ?? null;
    }
    return null;
  },

  // Memoized selector creator for specific dispenser orders
  createDispenserOrderSelector: (dispenserId: string, nozzleIds: string[]) => {
    return (orders: OrderEntity[]) => ({
      activeOrder: orderSelectors.getActiveOrderByDispenserId(
        orders,
        dispenserId,
        nozzleIds
      ),
      fuelingOrder: orderSelectors.getFuelingOrderByDispenserId(
        orders,
        dispenserId,
        nozzleIds
      ),
    });
  },
};
