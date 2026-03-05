import { Dialog, DialogContent } from "@/shared/ui/shadcn/dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { OrderEditor } from "@/features/manage-order";
import { ActiveOrdersCarousel } from "@/features/manage-order/ui/ActiveOrderCarousel";
import { useOrderStore } from "@/entities/order";
import { t } from "i18next";
import { Plus, Undo } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientSelector } from "@/entities/client/ui/ClientSelector";
import type { ClientEntity } from "@/entities/client";
type WarehouseOrdersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Warehouse-only cart/orders view.
 * Intentionally uses a centered modal (Dialog) instead of a sidebar sheet.
 */
export function WarehouseOrdersDialog({
  open,
  onOpenChange,
}: WarehouseOrdersDialogProps) {
  const loadActiveOrders = useOrderStore((s) => s.loadActiveOrders);
  const addSaleOrder = useOrderStore((s) => s.addSaleOrder);
  const addReturnOrder = useOrderStore((s) => s.addReturnOrder);
  const activeOrders = useOrderStore((s) => s.activeOrders);
  const selectActiveOrder = useOrderStore((s) => s.selectActiveOrder);
  const selectedOrder = useOrderStore((s) => s.selectedOrder) ?? null;
  const setActiveOrderClient = useOrderStore((s) => s.setActiveOrderClient);

  useEffect(() => {
    if (open) {
      loadActiveOrders();
    }
  }, [open, loadActiveOrders]);

  // Auto-select first Sale/Returns order when dialog opens
  useEffect(() => {
    if (!open) return;

    const saleOrders = activeOrders.filter(
      (order) =>
        order.order_type === "Sale" ||
        order.order_type === "Returns"
    );

    if (
      selectedOrder &&
      selectedOrder.order_type !== "Sale" &&
      selectedOrder.order_type !== "Returns"
    ) {
      selectActiveOrder(saleOrders[0]?.id ?? null);
    } else if (!selectedOrder) {
      selectActiveOrder(saleOrders[0]?.id ?? null);
    }
  }, [open, activeOrders, selectedOrder, selectActiveOrder]);

  /**
   * Локально храним выбранного клиента для UI,
   * но источник истины — selectedOrder.client_id (в сторе/бэке).
   *
   * ВАЖНО:
   * Если ClientSelector сам умеет подтягивать ClientEntity по id,
   * можно передавать value как объект.
   * Если нет — оставляем так, и просто ставим локально то, что выбрали.
   */
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(null);

  // Когда переключаемся между заказами — можно сбрасывать UI клиента
  // (если у тебя есть способ получить ClientEntity по selectedOrder.client_id — подставь здесь)
  useEffect(() => {
    if (!selectedOrder?.id) {
      setSelectedClient(null);
      return;
    }

    // Если в заказе клиент уже есть, но ClientEntity не загружен —
    // оставим как есть, или сбросим. Я оставлю "не трогаем",
    // чтобы не ломать UI, если ClientSelector сам держит значение.
    // setSelectedClient(null);
  }, [selectedOrder?.id]);

  const handleClientSelect = useCallback(async (client: ClientEntity | null) => {
  setSelectedClient(client);

  if (!selectedOrder?.id) return;

  await setActiveOrderClient(selectedOrder.id, client?.id ?? null);
}, [selectedOrder?.id, setActiveOrderClient]);

  const canChangeClient = useMemo(() => {
    // тут можешь запретить смену клиента для закрытых/не тех типов и т.д.
    return !!selectedOrder?.id;
  }, [selectedOrder?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[min(96vw,72rem)] h-[min(90vh,56rem)] p-0 overflow-hidden">
        <div className="h-full flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-3 border-b bg-muted/30 flex items-center gap-2">
            <Button size="sm" onClick={() => addReturnOrder()}>
              <Undo className="h-4 w-4 mr-2" />
              {t("control.return")}
            </Button>

            {/* Создание продажи: можно передать selectedClient (если хочешь создавать сразу с клиентом) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addSaleOrder(selectedClient?.id ?? "")}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("control.sale")}
            </Button>

            <div className="ml-auto text-sm text-muted-foreground">
              {t("order.manage_active_orders")}
            </div>
          </div>

          {/* ✅ Клиента можно менять всегда (даже после добавления товаров) */}
          <div className="flex-shrink-0 border-b p-3">
            <ClientSelector
              onSelect={handleClientSelect}
              value={selectedClient}
              placeholder={t(
                "order.select_client_for_new_order",
                "Select client for new order"
              )}
              disabled={canChangeClient} // ❗️не блокируем из-за selectedClient
            />
          </div>

          {/* Active orders carousel */}
          <div className="flex-shrink-0 border-b bg-muted/30">
            <div className="px-1">
              <ActiveOrdersCarousel
                order_types={["Sale", "Returns"]}
              />
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <OrderEditor className="h-full" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
