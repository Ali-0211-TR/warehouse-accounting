import { ClientEntity } from "@/entities/client";
import { ClientSelector } from "@/entities/client/ui/ClientSelector";
import { formatStringDate } from "@/shared/helpers";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { CarouselItem } from "@/shared/ui/shadcn/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { Edit2, ShoppingCart, User } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { OrderEntity } from "../model/types";

interface OneOrderCardProps {
  order: OrderEntity;
  selectedOrder: OrderEntity | null;
  selectActiveOrder: (id: string | null) => void;
  onUpdateClient?: (
    orderId: string,
    client: ClientEntity | null
  ) => Promise<void>;
  disabled?: boolean;
}

export const OneOrderCard = React.memo(
  ({
    order,
    selectedOrder,
    selectActiveOrder,
    onUpdateClient,
    disabled = false,
  }: OneOrderCardProps) => {
    const { t } = useTranslation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isSelected = selectedOrder?.id === order.id;

    const handleClientChange = useCallback(
      async (client: ClientEntity | null) => {
        if (!order.id || !onUpdateClient) return;

        try {
          setIsUpdating(true);
          await onUpdateClient(order.id, client);
          setIsEditMode(false);
        } catch (error) {
          console.error("Failed to update client:", error);
        } finally {
          setIsUpdating(false);
        }
      },
      [order.id, onUpdateClient]
    );

    const handleCardClick = useCallback(() => {
      if (!isEditMode && order.id && !disabled) {
        selectActiveOrder(order.id);
      }
    }, [isEditMode, order.id, disabled, selectActiveOrder]);

    // Format the order amount with currency
    const formatAmount = useCallback(
      (amount: number) => {
        return (
          new Intl.NumberFormat("uz-UZ", {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(amount) +
          " " +
          t("currency.sum", "сум")
        );
      },
      [t]
    );

    return (
      <CarouselItem className="p-1 basis-auto">
        <TooltipProvider>
          <Card
            className={cn(
              "w-48 h-20 p-2 transition-all cursor-pointer select-none",
              isSelected
                ? "ring-2 ring-primary bg-primary/5 shadow-md"
                : "hover:bg-muted/50 hover:shadow-sm",
              disabled && "opacity-50 cursor-not-allowed",
              isUpdating && "opacity-75"
            )}
            onClick={handleCardClick}
          >
            <CardContent className="p-0 h-full flex flex-col justify-between">
              {/* Header with date/time and edit button */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {order.d_created
                    ? formatStringDate(order.d_created)
                    : t("order.new", "New")}
                </Badge>
                <div className="flex items-center gap-1">
                  {onUpdateClient && (
                    <Popover open={isEditMode} onOpenChange={setIsEditMode}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                          onClick={e => {
                            e.stopPropagation();
                            setIsEditMode(!isEditMode);
                          }}
                          disabled={disabled || isUpdating}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 p-3"
                        side="bottom"
                        align="end"
                      >
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">
                            {t("order.edit_client", "Edit Client")}
                          </h4>
                          <ClientSelector
                            value={order.client}
                            onSelect={handleClientChange}
                            placeholder={t(
                              "order.select_client",
                              "Select client..."
                            )}
                            disabled={isUpdating}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>

              {/* Client info */}
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground truncate">
                      {order.client?.name || t("order.no_client", "No client")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {order.client?.name || t("order.no_client", "No client")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Amount and order type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* <DollarSign className="h-3 w-3 text-muted-foreground" /> */}
                  <span className="text-xs font-medium">
                    {formatAmount(order.summ)}
                  </span>
                </div>
                {order.order_type && (
                  <Badge variant="secondary" className="text-xs px-1 py-0.5">
                    {t(
                      `order.type.${order.order_type.toLowerCase()}`,
                      order.order_type
                    )}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>
      </CarouselItem>
    );
  }
);

OneOrderCard.displayName = "OneOrderCard";
