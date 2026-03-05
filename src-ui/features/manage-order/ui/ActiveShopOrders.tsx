import { OneOrderCard, useOrderStore } from "@/entities/order";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { Carousel, CarouselContent } from "@/shared/ui/shadcn/carousel";
import { CarouselItem } from "@/shared/ui/shadcn/carousel";
import React from "react";

export const ActiveShopOrders = React.memo(function ActiveShopOrders() {
    const activeOrders = useOrderStore((s) => s.activeOrders);
    const selectActiveOrder = useOrderStore((s) => s.selectActiveOrder);
    const selectedOrder = useOrderStore((s) => s.selectedOrder);

    // Filter for shop orders (non-dispenser orders)
    const shopOrders = activeOrders.filter(order =>
        order.order_type === 'Sale'
    );

    // const handleAddOrder = async () => {
    //     try {
    //         const newOrderData = {
    //             order_type: 'Sale',
    //             items: [],
    //             summ: 0,
    //             tax: 0,
    //             d_created: new Date().toISOString(),
    //             client_id: null,
    //             contract_id: null,
    //             contract_car_id: null,
    //             d_move: null,
    //             discard: null
    //         };

    //         await addSaleOrder(newOrderData as OrderDTO);
    //     } catch (error) {
    //         console.error('Failed to add order:', error);
    //     }
    // };

    return (
        <div className="w-full">
            <Carousel className="w-full">
                <CarouselContent className="m-0">
                    {/* Add New Order Card */}
                    {/* <CarouselItem key="add-new" className="pl-2 basis-auto">
                        <Card className="w-20 h-16 hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 border-muted-foreground/25 hover:border-primary/50" onClick={handleAddOrder}>
                            <CardContent className="flex flex-col items-center justify-center p-2 h-full">
                                <Plus className="h-4 w-4 text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground">New</span>
                            </CardContent>
                        </Card>
                    </CarouselItem> */}

                    {/* Active Order Cards */}
                    {shopOrders.map((order) => (
                        <OneOrderCard
                            key={`shop-order-${order.id}`}
                            order={order}
                            selectedOrder={selectedOrder}
                            selectActiveOrder={selectActiveOrder}
                        />
                    ))}

                    {/* No Orders Message */}
                    {shopOrders.length === 0 && (
                        <CarouselItem key="no-orders" className="pl-2 basis-auto">
                            <Card className="w-40 h-16 border-dashed border-2 border-muted-foreground/25">
                                <CardContent className="flex items-center justify-center p-0 h-full text-xs text-muted-foreground">
                                    No active shop orders
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    )}
                </CarouselContent>

                {/* Navigation Arrows */}
                {/* {shopOrders.length > 3 && (
                    <>
                        <CarouselPrevious className="left-0" />
                        <CarouselNext className="right-0" />
                    </>
                )} */}
            </Carousel>
        </div>
    );
});



