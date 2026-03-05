import { OneOrderCard, useOrderStore } from "@/entities/order";
import type { OrderType } from "@/shared/bindings/OrderType";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/shadcn/carousel";
import { Plus } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

type ActiveOrdersCarouselProps = {
  order_type?: OrderType;
  order_types?: OrderType[]; // Support multiple order types
  onAddOrder?: () => void;
};

export const ActiveOrdersCarousel = React.memo(function ActiveOrdersCarousel({
  order_type,
  order_types,
  onAddOrder,
}: ActiveOrdersCarouselProps) {
  const activeOrders = useOrderStore((s) => s.activeOrders);
  const selectActiveOrder = useOrderStore((s) => s.selectActiveOrder);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  const { t } = useTranslation();

  // Filter orders by order_type(s) if provided
  const filteredOrders = order_types
    ? activeOrders.filter(order => order_types.includes(order.order_type))
    : order_type
    ? activeOrders.filter(order => order.order_type === order_type)
    : activeOrders;

  // If no orders to show and not Sale/Returns, return null
  if (
    !filteredOrders.length &&
    order_type !== "Sale" &&
    order_type !== "Returns"
  )
    return null;

  // Show add button for Sale and Returns
  const showAddButton = order_type === "Sale" || order_type === "Returns";

  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent className="m-0">
          {/* Add New Order Card at the beginning if order_type is "Sale" or "Returns" */}
          {showAddButton && (
            <CarouselItem key="add-new" className="p-1 basis-auto">
              <Card
                className="w-32 h-16 p-1 hover:shadow-md transition-all cursor-pointer select-none hover:bg-muted/50 border-dashed border-2 border-muted-foreground/25 flex items-center justify-center"
                onClick={onAddOrder}
              >
                <CardContent className="p-0 m-0 h-full flex flex-col justify-center items-center">
                  <Plus className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {t("control.add")}
                  </span>
                </CardContent>
              </Card>
            </CarouselItem>
          )}

          {/* Active Order Cards */}
          {filteredOrders.map(order => (
            <OneOrderCard
              key={`order-${order.id}`}
              order={order}
              selectedOrder={selectedOrder}
              selectActiveOrder={selectActiveOrder}
            />
          ))}

          {/* No Orders Message for Sale or Returns */}
          {showAddButton && filteredOrders.length === 0 && (
            <CarouselItem key="no-orders" className="p-1 basis-auto">
              <Card className=" h-16 p-1 border-dashed border-2 border-muted-foreground/25 flex items-center justify-center">
                <CardContent className="p-0 m-0 h-full flex flex-col justify-center items-center">
                  <span className="text-xs text-muted-foreground">
                    {t("order.no_active_orders")}
                  </span>
                </CardContent>
              </Card>
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
    </div>
  );
});
