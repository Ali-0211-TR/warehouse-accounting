import { useEffect, useState } from "react";
import { t } from "i18next";
import {
  formatDate,
  formatStringDate,
  getStrId,
} from "../../../shared/helpers/index.ts";
import { OrderEntity } from "../../../shared/bindings/OrderEntity.ts";
import { OrderTypeTag } from "../../../shared/ui/order-type-tag/order-type-tag.ui.tsx";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/ui/shadcn/card";
import { Badge } from "@/shared/ui/shadcn/badge";
import { PlusCircle, Filter, Printer } from "lucide-react";
import { useOrderStore } from "@/entities/order/index.ts";

export function ReportMovementsList() {
  const [loading, setLoading] = useState<boolean>(false);
  const orders = useOrderStore((s) => s.orders);
  const loadOrders = useOrderStore((s) => s.loadOrders);

  useEffect(() => {
    setLoading(true);
    // getOrders().then(() => setLoading(false));
  }, [loadOrders]);

  // Header actions
  const header = (
    <div className="flex items-center gap-2 mb-4">
      <span className="font-semibold">{t("menu.dictionary.movements")}</span>
      <Button variant="outline" size="icon" title={t("Clear filters")}>
        <Filter className="h-4 w-4" />
      </Button>
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        // onClick={...} // Add logic for creating new movement if needed
      >
        <PlusCircle className="h-4 w-4" />
        {t("lists.order_type.Income")}
      </Button>
    </div>
  );

  // Table row
  const row = (order: OrderEntity) => (
    <div
      key={order.id}
      className="flex flex-col md:flex-row md:items-center gap-2 p-3 border-b hover:bg-accent cursor-pointer"
    >
      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
        <Badge variant="secondary">{getStrId(order.id ?? 0)}</Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(new Date(order.d_created))}
        </span>
        <span className="text-xs text-muted-foreground">
          {order.client?.name}
        </span>
        <span className="text-xs">{order.summ}</span>
        <span className="text-xs">{order.tax}</span>
        <span className="flex items-center gap-2">
          {OrderTypeTag(order.order_type)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {order.d_move ? (
          <Badge variant="secondary">{formatStringDate(order.d_move)}</Badge>
        ) : (
          <Badge variant="destructive">{t("Активный")}</Badge>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{header}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="flex flex-row items-center gap-2 px-3 py-2 border-b bg-muted font-semibold text-xs text-muted-foreground">
                <span className="w-20">{t("order.id")}</span>
                <span className="w-32">{t("order.d_created")}</span>
                <span className="w-40">{t("order.client")}</span>
                <span className="w-24">{t("order.summ")}</span>
                <span className="w-24">{t("order.tax")}</span>
                <span className="w-40">{t("order.order_type")}</span>
                <span className="w-40">{t("order.d_move")}</span>
                <span className="w-20">{t("control.actions")}</span>
              </div>
              {loading ? (
                <div className="text-center py-8">{t("loading")}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">{t("message.no_data")}</div>
              ) : (
                orders.map(row)
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* You can add a Sheet or Dialog for selectedOrder details/printing if needed */}
    </div>
  );
}
