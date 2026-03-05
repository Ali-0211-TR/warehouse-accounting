import { useDeviceConfigStore } from "@/entities/device-config";
import { useSettingsState } from "@/entities/settings";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";
import { invoke } from "@tauri-apps/api/core";
import { t } from "i18next";
import { Loader2, Printer, Receipt, X } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderEntity } from "../../../shared/bindings/OrderEntity";
import { formatStringDate, getStrId } from "../../../shared/helpers";

type PrintChequeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderEntity | null;
};

export function PrintChequeDialog({
  open,
  onOpenChange,
  order,
}: PrintChequeDialogProps) {
  const { deviceConfig, fetchDeviceConfig } = useDeviceConfigStore();
  const { data: settingsData } = useSettingsState();
  const [isPrinting, setIsPrinting] = useState(false);

  // Use device config for company info
  const company = deviceConfig;
  // Refresh device config when dialog opens to get latest logo_path
  useEffect(() => {
    if (open) {
      fetchDeviceConfig();
    }
  }, [open, fetchDeviceConfig]);

  const handlePrint = async () => {
    if (!order?.id) {
      console.error("❌ No order ID available");
      return;
    }

    setIsPrinting(true);

    try {
      const selectedOrderPrinter =
        settingsData.orderPrinterName || settingsData.printerName;

      // Use print_to_named_printer if a specific printer is selected, otherwise use default
      if (selectedOrderPrinter) {
        const response = await invoke<{
          error: { message: string } | null;
          result: { data: { success: boolean; message: string } } | null;
        }>("print_to_named_printer", {
          params: {
            printer_name: selectedOrderPrinter,
            order_id: order.id,
            printer_width: settingsData.orderPrinterWidth,
          },
        });

        if (response.error) {
          alert(`Print failed: ${response.error.message}`);
        }
      } else {
        // Fallback to default printer
        const response = await invoke<{
          error: { message: string } | null;
          result: { data: { success: boolean; message: string } } | null;
        }>("print_receipt_by_order", {
          params: {
            order_id: order.id,
            printer_width: settingsData.orderPrinterWidth,
          },
        });
        if (response.error) {
          console.error("❌ Print failed:", response.error.message);
          alert(`Print failed: ${response.error.message}`);
        } else if (response.result?.data?.success) {
        }
      }
    } catch (error) {
      console.error("❌ Error calling print command:", error);
      alert(`Print error: ${error}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Calculate totals for better display
  const calculateTotals = () => {
    if (!order?.items)
      return { subtotal: 0, totalDiscount: 0, totalTax: 0, finalTotal: 0 };

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.count * item.price,
      0
    );
    const totalDiscount = order.items.reduce(
      (sum, item) => sum + item.discount,
      0
    );
    const totalTax = order.items.reduce((sum, item) => sum + item.tax, 0);
    const finalTotal = order.summ;

    return { subtotal, totalDiscount, totalTax, finalTotal };
  };

  const totals = calculateTotals();

  // Format currency

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t("message.no_data")}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            {t("message.no_data")}
          </div>
          <DialogFooter>
            <Button onClick={handleClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              {t("control.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const getOrderTypeBadge = (orderType: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      Sale: "default",
      Dispenser: "secondary",
      Return: "destructive",
    };
    return (
      <Badge variant={variants[orderType] || "outline"}>
        {t(`order.type.${orderType.toLowerCase()}`) || orderType}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t("title.order_cheque")}: {getStrId(order.id ?? 0)}
              {getOrderTypeBadge(order.order_type)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="flex justify-center">
            <div
              className="bg-white border rounded shadow-sm p-4 w-full max-w-xs font-mono text-xs text-black dark:text-black"
              style={{ minWidth: 240, maxWidth: 320, color: '#000' }}
            >
              {/* Header */}
              <div className="text-center font-bold text-base mb-1">
                {company?.company_name || t("company.name", "MY COMPANY")}
              </div>
              <div className="text-center text-[10px]">
                {company?.company_address ||
                  t("company.address", "Address: ...")}
              </div>
              <div className="text-center text-[10px] mb-1">
                {company?.company_phone
                  ? `${t("company.phone", "Phone")}: ${company.company_phone}`
                  : t("company.phone", "Phone: ...")}
              </div>
              <div className="border-b border-dashed my-1" />
              <div className="flex justify-between text-[11px]">
                <span>
                  {t("order.cheque_number", "Cheque No")}:{" "}
                  {getStrId(order.id ?? 0)}
                </span>
                <span>{formatStringDate(order.d_created)}</span>
              </div>
              <div className="border-b border-dashed my-1" />

              {/* Items */}
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className="mb-1">
                  <div className="flex items-start gap-2">
                    <div className="w-5 flex-shrink-0 text-right">{idx + 1}.</div>
                    <div className="min-w-0 flex-1">
                      <div className="break-words">
                        {item.product?.name || t("product.unknown")}
                      </div>
                      <div>
                        {item.count} {item.product?.unit?.short_name || ""} x{" "}
                        {item.price.toLocaleString()} ={" "}
                        {(item.count * item.price).toLocaleString()}{" "}
                        {t("currency.sum")}
                      </div>
                      {item.tax > 0 && (
                        <div className="text-blue-700">
                          {t("order.tax", "Tax")}: {item.tax.toLocaleString()} {t("currency.sum")}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.discounts && item.discounts.length > 0 && (
                    <div className="text-green-700">
                      {item.discounts.map((d, i) => (
                        <span key={i}>
                          {d.name}: -{d.value.toLocaleString()}{" "}
                          {t("currency.sum")}
                          {i < item.discounts.length - 1 ? "  " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.taxes && item.taxes.length > 0 && (
                    <div className="text-blue-700">
                      {item.taxes.map((tax, i) => (
                        <span key={i}>
                          {tax.name}: {tax.value.toLocaleString()}{" "}
                          {t("currency.sum")}
                          {i < item.taxes.length - 1 ? "  " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-right font-bold">
                    {t("order_item.cost")}: {item.cost.toLocaleString()}{" "}
                    {t("currency.sum")}
                  </div>
                  <div className="border-b border-dashed my-1" />
                </div>
              ))}

              {/* Totals */}
              <div className="text-right">
                {t("order.subtotal")}: {totals.subtotal.toLocaleString()}{" "}
                {t("currency.sum")}
              </div>
              {totals.totalDiscount > 0 && (
                <div className="text-right text-green-700">
                  {t("order.total_discount")}: -
                  {totals.totalDiscount.toLocaleString()} {t("currency.sum")}
                </div>
              )}
              {totals.totalTax > 0 && (
                <div className="text-right text-blue-700">
                  {t("order.total_tax")}: +{totals.totalTax.toLocaleString()}{" "}
                  {t("currency.sum")}
                </div>
              )}
              <div className="border-b border-dashed my-1" />
              <div className="text-right font-bold text-base">
                {t("order.total")}: {order.summ.toLocaleString()}{" "}
                {t("currency.sum")}
              </div>
              {order.d_move && (
                <div className="text-right text-[10px]">
                  {t("order.d_move")}: {formatStringDate(order.d_move)}
                </div>
              )}
              {order.discard && (
                <div className="text-right text-[10px] text-destructive">
                  {t("order.discard")}: {order.discard}
                </div>
              )}
              <div className="border-b border-dashed my-1" />
              <div className="text-center text-[10px]">
                {t("order.thank_you", "Thank you for your purchase!")}
              </div>
              <div className="border-b border-dashed my-1" />
              <div className="text-left text-[10px]">
                {t("order.cashier", "Cashier")}: ___________
              </div>
              <div className="text-left text-[10px]">
                {t("order.date")}: {formatStringDate(order.d_created)}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button onClick={handleClose} variant="outline" disabled={isPrinting}>
            <X className="h-4 w-4 mr-2" />
            {t("control.close")}
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("control.printing", "Printing...")}
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                {t("control.print")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
