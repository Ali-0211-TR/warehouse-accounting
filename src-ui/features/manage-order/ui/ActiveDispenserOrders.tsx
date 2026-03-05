// @ts-nocheck
import { OneOrderCard, useOrderStore } from "@/entities/order";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/shadcn/carousel";
import React from "react";

export const ActiveDispenserOrders = React.memo(function ActiveDispenserOrders() {
  const activeOrders = useOrderStore((s) => s.activeOrders);
  const selectActiveOrder = useOrderStore((s) => s.selectActiveOrder);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);

  // Filter for dispenser orders (you might need to adjust this logic based on your order types)
  const dispenserOrders = activeOrders.filter(
    order => order.order_type === "SaleDispenser"
  );

  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent className="ml-1">
          {/* Active Dispenser Order Cards */}
          {dispenserOrders.map(order => (
            <OneOrderCard
              order={order}
              selectedOrder={selectedOrder}
              selectActiveOrder={selectActiveOrder}
            />
          ))}

          {dispenserOrders.length === 0 && (
            <CarouselItem className="pl-2 basis-auto">
              <Card className="w-40 h-16">
                <CardContent className="flex items-center justify-center p-0 h-full text-xs text-muted-foreground">
                  No dispenser orders
                </CardContent>
              </Card>
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
    </div>
  );
});
