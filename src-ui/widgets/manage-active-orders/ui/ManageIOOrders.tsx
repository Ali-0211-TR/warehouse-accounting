import { OrderEditor } from "@/features/manage-order";
import { ActiveOrdersCarousel } from "@/features/manage-order/ui/ActiveOrderCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/shadcn/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/shadcn/tabs";
import { t } from "i18next";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOrderStore } from "@/entities/order";
import { useSettingsState } from "@/entities/settings";

type ManageOrdersProps = {
  open: boolean;
  activeOrderId?: string | null;
  onOpenChange: (open: boolean) => void;
};

export const ManageIOOrders = ({ open, activeOrderId, onOpenChange }: ManageOrdersProps) => {
  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  const selectActiveOrder = useOrderStore((s) => s.selectActiveOrder);
  const { data } = useSettingsState();

  const isWarehouse = (data?.appMode ?? "fuel") === "warehouse";
  const [activeTab, setActiveTab] = useState<"income" | "outcome">("income");

  // ✅ Guard against duplicate loadActiveOrders calls (StrictMode + reopen)
  const didLoadRef = useRef(false);

  useEffect(() => {
    if (!open) {
      // allow re-load next time you open
      didLoadRef.current = false;
      return;
    }

    if (didLoadRef.current) return;
    didLoadRef.current = true;

    // ✅ Call from store directly to avoid effect re-runs due to function identity
    useOrderStore.getState().loadActiveOrders();
  }, [open]);

  useEffect(() => {
    if (open && activeOrderId) {
      selectActiveOrder(activeOrderId);
    }
  }, [open, activeOrderId, selectActiveOrder]);

  // Auto-select first IO order when opened (only if no activeOrderId)
  useEffect(() => {
    if (!open || activeOrderId) return;

    const { activeOrders, selectedOrder: current } = useOrderStore.getState();

    const ioOrders = activeOrders.filter(
      o => o.order_type === "Income" || o.order_type === "Outcome"
    );

    if (!current && ioOrders.length) {
      selectActiveOrder(ioOrders[0].id!);
    }
  }, [open, activeOrderId, selectActiveOrder]);

  useEffect(() => {
    if (!selectedOrder) return;

    setActiveTab(selectedOrder.order_type === "Outcome" ? "outcome" : "income");
  }, [selectedOrder?.order_type]);

  const visibleTabs = selectedOrder
    ? selectedOrder.order_type === "Income"
      ? ["income"]
      : selectedOrder.order_type === "Outcome"
      ? ["outcome"]
      : ["income", "outcome"]
    : ["income", "outcome"];

  const renderTab = (value: "income" | "outcome") => {
    if (!visibleTabs.includes(value)) return null;

    const config = {
      income: { icon: <ArrowDownLeft className="h-3 w-3" />, label: t("order.income") },
      outcome: { icon: <ArrowUpRight className="h-3 w-3" />, label: t("order.outcome") },
    }[value];

    return (
      <TabsTrigger key={value} value={value} className="flex items-center gap-1 text-xs">
        {config.icon}
        <span className="hidden sm:inline">{config.label}</span>
      </TabsTrigger>
    );
  };

  const content = (
    <Tabs
      value={activeTab}
      onValueChange={v => setActiveTab(v as any)}
      className="flex flex-col min-h-0 h-full"
    >
      <div className="shrink-0 border-b bg-muted/30">
        <TabsList
          className={`grid w-full ${visibleTabs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {renderTab("income")}
          {renderTab("outcome")}
        </TabsList>
      </div>

      <div className="shrink-0 border-b bg-muted/30 px-1">
        {activeTab === "income" && <ActiveOrdersCarousel order_type="Income" />}
        {activeTab === "outcome" && <ActiveOrdersCarousel order_type="Outcome" />}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <OrderEditor className="h-full" />
      </div>
    </Tabs>
  );

  if (isWarehouse) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[calc(100vh-16px)] p-0 flex flex-col">
          <DialogHeader className="p-3 border-b bg-muted/30 shrink-0">
            <DialogTitle>{t("order.manage_active_orders")}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">{content}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="p-3 border-b bg-muted/30 shrink-0">
          <SheetTitle>{t("order.manage_active_orders")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-hidden">{content}</div>
      </SheetContent>
    </Sheet>
  );
};
