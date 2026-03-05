import { useOrderStore } from "@/entities/order";
import { useProductStore } from "@/entities/product/model/store";
import { useSettingsState } from "@/entities/settings";
import type { CloseOrderDTO } from "@/shared/bindings/dtos/CloseOrderDTO";
import type { PaymentDTO } from "@/shared/bindings/dtos/PaymentDTO";
import { PaymentType } from "@/shared/bindings/PaymentType";
import { useBarcodeScanner } from "@/shared/hooks/use-barcode-scanner";
import { useToast } from "@/shared/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/shadcn/alert-dialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";
import { invoke } from "@tauri-apps/api/core";
import { t } from "i18next";
import { Printer, ShoppingCart, Eye, X } from "lucide-react";
import { useCallback, useEffect, useState, memo } from "react";
import { OrderItemsList } from "./OrderItemsList";
import { PaymentManager } from "./PaymentManager";
import { PrintChequeDialog } from "./PrintChequeDialog";
import { ProductSelector } from "./ProductSelector";


type OrderEditorProps = {
  className?: string;
};

export const OrderEditor = memo(function OrderEditor({ className = "" }: OrderEditorProps) {
  const loadProducts = useProductStore((s) => s.loadProducts);
  const products = useProductStore((s) => s.products);
  const addOrderItem = useOrderStore((s) => s.addOrderItem);
  const removeOrderFromActive = useOrderStore((s) => s.removeOrderFromActive);
  const closeActiveOrder = useOrderStore((s) => s.closeActiveOrder);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  const { data: settingsData } = useSettingsState();

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [viewChequeOpen, setViewChequeOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("Cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isPaymentsValid, setIsPaymentsValid] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  // Initialize payment amount when order changes or order total updates (e.g. fueling completes)
  useEffect(() => {
    if (selectedOrder) {
      const orderTotal = Number(selectedOrder.summ || 0);
      // Only auto-set if no payments have been added yet
      if (payments.length === 0) {
        setPaymentAmount(orderTotal);
      }
    }
  }, [selectedOrder?.id, selectedOrder?.summ]);

  // Reset payments when switching to a different order
  useEffect(() => {
    setPayments([]);
    setPaymentType("Cash");
    setIsPaymentsValid(false);
  }, [selectedOrder?.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Barcode scanner integration
  const handleBarcodeScan = useCallback(
  async (barcode: string) => {
    if (!selectedOrder?.id) {
      showErrorToast(t("order.no_order_selected"));
      return;
    }

    const normalizedBarcode = String(barcode).trim();

    try {
      const product = products.find((p) => p.bar_code?.trim() === normalizedBarcode);

      if (!product?.id) {
        showErrorToast(
          t("product.not_found_by_barcode", {
            normalizedBarcode: `Product with barcode ${normalizedBarcode} not found`,
          })
        );
        return;
      }

      // (остальная логика как у тебя)
      await addOrderItem({
        order_id: selectedOrder.id,
        product_id: product.id,
        count: 1,
      });
    } catch (error: any) {
      showErrorToast(error.message || t("error.failed_to_add_product"));
    }
  },
  [selectedOrder, products, addOrderItem, showErrorToast]
);


  // Enable barcode scanner when order is selected
  // ignoreInputFields: true will ignore all text/number inputs (including NumericInput)
  const { barcode } = useBarcodeScanner({
  onScan: handleBarcodeScan,
  enabled: !!selectedOrder,
  minLength: 6,        // обычно штрихкод длиннее
  scanTimeout: 50,     // 30–80 чаще лучше ловит сканер
  ignoreInputFields: true, // ВАЖНО
});


  const handlePrintCheque = () => {
    setPrintDialogOpen(true);
  };

  const handleAddPayment = async () => {
    if (!selectedOrder?.id || paymentAmount <= 0) {
      showErrorToast(t("error.invalid_amount"));
      return;
    }



    try {
      const newPayment: PaymentDTO = {
        payment_type: paymentType,
        summ: paymentAmount,
        delivery: 0,
        transaction: "",
        ticket: "",
        data: "",
        card_id: null,
      };

      // Add to local state (PaymentManager will handle the actual adding)
      setPayments([...payments, newPayment]);
      showSuccessToast(t("payment.payment_added"));

      // Reset form
      setPaymentAmount(0);
      setPaymentType("Cash");
    } catch (error) {
      console.error("Failed to add payment:", error);
      showErrorToast(t("error.failed_to_add_payment"));
    }
  };



  // If no order is selected, show a message
  if (!selectedOrder) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{t("order.no_order_selected")}</p>
          <p className="text-sm">{t("order.select_order_to_edit")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col h-full`}>
      {/* Fixed Top Section - Product Selector */}
      <div className="flex-shrink-0 p-1 border-b">
        <ProductSelector className="w-full" />

        {/* Barcode Scanner Indicator */}
        {barcode && (
          <div className="mt-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-600 dark:text-blue-400 font-mono">
            📦 Scanning: {barcode}
          </div>
        )}
      </div>

      {/* Flexible Middle Section - Order Items List and Payments */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{t("order.items")}</h3>
                <Badge variant="secondary" className="text-xs">
                  {t("order.items_count", {
                    count: selectedOrder.items?.length || 0,
                  })}
                </Badge>
              </div>
              <OrderItemsList
                className="w-full"
                items={selectedOrder.items || []}
                isEditable={true}
              />
            </div>

            {/* Payment Management Section */}
            <div>
              <PaymentManager
                order={selectedOrder}
                onPaymentsChanged={setPayments}
                onPaymentsValidated={setIsPaymentsValid}
                payments={payments}
                onPaymentsChange={setPayments}
                paymentType={paymentType}
                paymentAmount={paymentAmount}
                onPaymentTypeChange={setPaymentType}
                onPaymentAmountChange={setPaymentAmount}
                onAddPayment={handleAddPayment}
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Fixed Bottom Section - Action Buttons */}
      <div className="flex-shrink-0 p-4 bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrintCheque}>
              <Printer className="h-4 w-4" />
            </Button>

            {/* View Cheque button - shows cheque data in a dialog similar to active orders window */}
            <AlertDialog open={viewChequeOpen} onOpenChange={setViewChequeOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewChequeOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent
                className="
                p-0
                overflow-hidden

                /* MOBILE: fullscreen */
                w-[100vw] h-[100vh] max-w-none rounded-none
                left-0 top-0 translate-x-0 translate-y-0

                /* DESKTOP: centered modal */
                sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
                sm:h-auto sm:max-h-[85vh] sm:w-[95vw] sm:max-w-3xl sm:rounded-lg
              "
              >

                {/* Header */}
                <div className="p-4 border-b flex items-start justify-between gap-3">
                  <AlertDialogHeader className="min-w-0">
                    <AlertDialogTitle className="break-words">
                      {t("order.view_cheque") || "Cheque"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="break-words">
                      {t("order.cheque_details") || "Order receipt details"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setViewChequeOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Scrollable content */}
                <ScrollArea className="h-[calc(100vh-128px)] sm:h-[calc(85vh-128px)]">
                  <div className="p-4 space-y-4 min-w-0 overflow-x-hidden">
                    {/* Items */}
                    <div className="min-w-0 overflow-x-hidden">
                      <h4 className="text-sm font-medium">{t("order.items")}</h4>
                      <div className="mt-2 min-w-0 overflow-x-auto">
                        {/* ВАЖНО: тут даём возможность таблицам/спискам скроллиться по X,
              чтобы они НЕ раздували весь диалог */}
                        <OrderItemsList
                          className="w-full min-w-0"
                          items={selectedOrder.items || []}
                          isEditable={false}
                        />
                      </div>
                    </div>

                    {/* Payments */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium">{t("payment.payments")}</h4>

                      <div className="mt-2 space-y-2 min-w-0">
                        {(selectedOrder.payments || payments || []).length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            {t("payment.no_payments") || "No payments"}
                          </div>
                        )}

                        {(selectedOrder.payments || payments || []).map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-3 text-sm min-w-0">
                            <div className="min-w-0 flex-1 break-words">
                              {String(p.payment_type)}
                            </div>
                            <div className="shrink-0 font-medium tabular-nums">
                              {p.summ}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-3">
                      <div
                        className="
                          flex flex-col gap-1
                          sm:flex-row sm:items-center sm:justify-between sm:gap-3
                          text-sm font-semibold
                        "
                      >
                        <div className="break-words">
                          {t("order.total") || "Total"}
                        </div>

                        <div className="tabular-nums">
                          {selectedOrder.summ}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t">
                  <AlertDialogFooter className="flex-row justify-end gap-2">
                    <AlertDialogCancel>{t("control.close") || "Close"}</AlertDialogCancel>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>

            </AlertDialog>


            {/* Show different close buttons based on order total */}
            {selectedOrder.summ === 0 ? (
              // Simple close button when order total is 0
              <AlertDialog
                open={confirmCloseOpen}
                onOpenChange={setConfirmCloseOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button size="sm" onClick={() => setConfirmCloseOpen(true)}>
                    {t("order.close_order")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("order.confirm_close")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("order.close_warning")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("control.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setConfirmCloseOpen(false);
                        if (selectedOrder.id !== null) {
                          try {
                            const closeDTO: CloseOrderDTO = {
                              order_id: selectedOrder.id,
                              payments: payments,
                            };
                            // await invoke("close_active_order", {
                            //   params: closeDTO,
                            // });

                            await closeActiveOrder(closeDTO);
                            // Auto-print BEFORE removing order from store if setting is enabled
                            if (settingsData.printOnCloseOrder) {
                              try {
                                const selectedOrderPrinter =
                                  settingsData.orderPrinterName ||
                                  settingsData.printerName;

                                let printResponse;

                                // Use print_to_named_printer if a specific printer is selected
                                if (selectedOrderPrinter) {
                                  printResponse = await invoke<{
                                    error: { message: string } | null;
                                    result: {
                                      data: {
                                        success: boolean;
                                        message: string;
                                      };
                                    } | null;
                                  }>("print_to_named_printer", {
                                    params: {
                                      printer_name: selectedOrderPrinter,
                                      order_id: selectedOrder.id,
                                      printer_width: settingsData.orderPrinterWidth,
                                    },
                                  });
                                } else {
                                  // Fallback to default printer
                                  printResponse = await invoke<{
                                    error: { message: string } | null;
                                    result: {
                                      data: {
                                        success: boolean;
                                        message: string;
                                      };
                                    } | null;
                                  }>("print_receipt_by_order", {
                                    params: {
                                      order_id: selectedOrder.id,
                                      printer_width: settingsData.orderPrinterWidth,
                                    },
                                  });
                                }

                                if (printResponse.error) {
                                  showErrorToast(
                                    t(
                                      "error.print_failed",
                                      "Failed to print receipt"
                                    )
                                  );
                                } else if (
                                  printResponse.result?.data?.success
                                ) {
                                  showSuccessToast(
                                    t(
                                      "order.printed_successfully",
                                      "Receipt printed successfully"
                                    )
                                  );
                                }
                              } catch (printError) {
                                showErrorToast(
                                  t(
                                    "error.print_failed",
                                    "Failed to print receipt"
                                  )
                                );
                              }
                            }

                            // Remove order from store after successful close and print
                            removeOrderFromActive(selectedOrder.id);
                            showSuccessToast(t("order.closed_successfully"));
                          } catch (error: any) {
                            showErrorToast(
                              error?.message || t("error.failed_to_close_order")
                            );
                          }
                        }
                      }}
                    >
                      {t("control.finalize_order")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              // Add Payment & Close button when order has a balance
              <AlertDialog
                open={confirmCloseOpen}
                onOpenChange={setConfirmCloseOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => setConfirmCloseOpen(true)}
                    disabled={!isPaymentsValid && paymentAmount <= 0}
                  >
                    {t("control.add_payment_and_close") ||
                      "Add Payment & Close"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("order.confirm_close") ||
                        "Buyurtmani yopishni tasdiqlaysizmi?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("order.close_warning") ||
                        "Bu amal buyurtmani yakunlaydi va uni qayta tahrirlab bo'lmaydi."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("control.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setConfirmCloseOpen(false);
                        if (selectedOrder.id !== null) {
                          try {
                            // Add the final payment before closing
                            if (paymentAmount > 0) {
                              const finalPayment: PaymentDTO = {
                                payment_type: paymentType,
                                summ: paymentAmount,
                                delivery: 0,
                                transaction: "",
                                ticket: "",
                                data: "",
                                card_id: null,
                              };
                              const allPayments = [...payments, finalPayment];

                              const closeDTO: CloseOrderDTO = {
                                order_id: selectedOrder.id,
                                payments: allPayments,
                              };
                              closeActiveOrder(closeDTO);
                              // await invoke("close_active_order", {
                              //   params: closeDTO,
                              // });
                            } else {
                              const closeDTO: CloseOrderDTO = {
                                order_id: selectedOrder.id,
                                payments: payments,
                              };
                              closeActiveOrder(closeDTO);
                              // await invoke("close_active_order", {
                              //   params: closeDTO,
                              // });
                            }

                            // Auto-print BEFORE removing order from store if setting is enabled
                            if (settingsData.printOnCloseOrder) {
                              try {
                                const selectedOrderPrinter =
                                  settingsData.orderPrinterName ||
                                  settingsData.printerName;

                                let printResponse;

                                // Use print_to_named_printer if a specific printer is selected
                                if (selectedOrderPrinter) {
                                  printResponse = await invoke<{
                                    error: { message: string } | null;
                                    result: {
                                      data: {
                                        success: boolean;
                                        message: string;
                                      };
                                    } | null;
                                  }>("print_to_named_printer", {
                                    params: {
                                      printer_name: selectedOrderPrinter,
                                      order_id: selectedOrder.id,
                                      printer_width: settingsData.printerWidth,
                                    },
                                  });
                                } else {
                                  // Fallback to default printer
                                  printResponse = await invoke<{
                                    error: { message: string } | null;
                                    result: {
                                      data: {
                                        success: boolean;
                                        message: string;
                                      };
                                    } | null;
                                  }>("print_receipt_by_order", {
                                    params: {
                                      order_id: selectedOrder.id,
                                      printer_width: settingsData.printerWidth,
                                    },
                                  });
                                }

                                if (printResponse.error) {
                                  showErrorToast(
                                    t(
                                      "error.print_failed",
                                      "Failed to print receipt"
                                    )
                                  );
                                } else if (
                                  printResponse.result?.data?.success
                                ) {
                                  showSuccessToast(
                                    t(
                                      "order.printed_successfully",
                                      "Receipt printed successfully"
                                    )
                                  );
                                }
                              } catch (printError) {
                                showErrorToast(
                                  t(
                                    "error.print_failed",
                                    "Failed to print receipt"
                                  )
                                );
                              }
                            }

                            // Remove order from store after successful close and print
                            removeOrderFromActive(selectedOrder.id);

                            showSuccessToast(t("order.closed_successfully"));
                          } catch (error: any) {
                            showErrorToast(
                              error?.message || t("error.failed_to_close_order")
                            );
                          }
                        }
                      }}
                    >
                      {t("control.finalize_order")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Print Cheque Dialog */}
      <PrintChequeDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
});
