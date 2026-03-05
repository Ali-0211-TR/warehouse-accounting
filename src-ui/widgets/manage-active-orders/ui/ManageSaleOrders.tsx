import { OrderEditor } from "@/features/manage-order";
import { ActiveOrdersCarousel } from "@/features/manage-order/ui/ActiveOrderCarousel";
import { Button } from "@/shared/ui/shadcn/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/shadcn/sheet";
import { t } from "i18next";
import { Plus, Undo } from "lucide-react";
import { useEffect, useRef } from "react";
import { useOrderStore } from "../../../entities/order";

type ManageOrdersSheetProps = {
  open: boolean;
  activeOrderId?: string | null;
  onOpenChange: (open: boolean) => void;
};

export const ManageSalerOrdersSheet = ({ open, onOpenChange }: ManageOrdersSheetProps) => {
  const addSaleOrder = useOrderStore((s) => s.addSaleOrder);
  const addReturnOrder = useOrderStore((s) => s.addReturnOrder);
  const activeOrders = useOrderStore((s) => s.activeOrders);
  const selectActiveOrder = useOrderStore((s) => s.selectActiveOrder);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);



  // ✅ Guard against duplicate loadActiveOrders calls (StrictMode + reopen)
  const didLoadRef = useRef(false);


  useEffect(() => {
    if (!open) {
      didLoadRef.current = false;
      return;
    }

    if (didLoadRef.current) return;
    didLoadRef.current = true;

    // ✅ Call from store directly to avoid effect re-runs due to function identity
    useOrderStore.getState().loadActiveOrders();
  }, [open]);

  // Auto-select first Sale/Returns order when sheet opens
  useEffect(() => {
    if (!open) return;

    const saleOrders = activeOrders.filter(
      order =>
        order.order_type === "Sale" ||
        order.order_type === "Returns"
    );

    const selectedIsSale =
      selectedOrder &&
      (selectedOrder.order_type === "Sale" ||
        selectedOrder.order_type === "Returns");

    if (!selectedIsSale) {
      if (saleOrders.length > 0) {
        selectActiveOrder(saleOrders[0].id!);
      } else {
        selectActiveOrder(null);
      }
    } else if (!selectedOrder && saleOrders.length > 0) {
      selectActiveOrder(saleOrders[0].id!);
    }
  }, [open, activeOrders, selectedOrder, selectActiveOrder]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-6xl w-full flex flex-col h-full">
        <SheetHeader className="flex-shrink-0 p-3 border-b bg-muted/30">
          <div className="flex flex-row gap-2">
            <Button size="sm" onClick={() => addReturnOrder()}>
              <Undo className="h-4 w-4 mr-2" />
              {t("control.return")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addSaleOrder()}>
              <Plus className="h-4 w-4 mr-2" />
              {t("control.sale")}
            </Button>
          </div>
          <SheetTitle className="text-lg font-semibold" />
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-shrink-0">
            <ActiveOrdersCarousel order_types={["Sale", "Returns"]} />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <OrderEditor className="h-full" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
