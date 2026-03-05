import { OrderEntity } from "@/entities/order";
import type { PaymentDTO } from "@/shared/bindings/dtos/PaymentDTO";
import { PaymentType } from "@/shared/bindings/PaymentType";
import useToast from "@/shared/hooks/use-toast";
import { NumericInput } from "@/shared/ui/NumericInput";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Label } from "@/shared/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { invoke } from "@tauri-apps/api/core";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface PaymentManagerProps {
  order: OrderEntity;
  onPaymentsValidated?: (isValid: boolean) => void;
  onPaymentsChanged?: (payments: PaymentDTO[]) => void;
  // Controlled payments
  payments?: PaymentDTO[];
  onPaymentsChange?: (payments: PaymentDTO[]) => void;
  mode?: "local" | "immediate"; // 'local' = collect locally, 'immediate' = save to backend
  // Controlled payment form props
  paymentType?: PaymentType;
  paymentAmount?: number;
  onPaymentTypeChange?: (type: PaymentType) => void;
  onPaymentAmountChange?: (amount: number) => void;
  onAddPayment?: () => void;
}

const PAYMENT_TYPES: PaymentType[] = [
  "Unknown",
  "Cash",
  "CashlessCard",
  "CashlessContract",
  "CashlessTicket",
  "CashlessIdCard",
  "CashlessBonus",
  "CashlessFuel",
  "CashlessYandex",
];

export function PaymentManager({
  order,
  onPaymentsValidated,
  onPaymentsChanged,
  payments: externalPayments,
  onPaymentsChange,
  mode = "local", // Default to local mode for closing with payments
  // Controlled form props
  paymentType: externalPaymentType,
  paymentAmount: externalPaymentAmount,
  onPaymentTypeChange,
  onPaymentAmountChange,
  onAddPayment: externalAddPayment,
}: PaymentManagerProps) {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();

  // Use internal state only when not controlled
  const [internalPayments, setInternalPayments] = useState<PaymentDTO[]>([]);
  const [internalPaymentType, setInternalPaymentType] =
    useState<PaymentType>("Cash");
  const [internalPaymentAmount, setInternalPaymentAmount] = useState<number>(0);

  // Determine which state to use - controlled vs uncontrolled
  const payments = externalPayments ?? internalPayments;
  const newPaymentType = externalPaymentType ?? internalPaymentType;
  const newPaymentAmount = externalPaymentAmount ?? internalPaymentAmount;

  const handleTypeChange = (type: PaymentType) => {
    if (onPaymentTypeChange) {
      onPaymentTypeChange(type);
    } else {
      setInternalPaymentType(type);
    }
  };

  const handleAmountChange = (amount: number) => {
    if (onPaymentAmountChange) {
      onPaymentAmountChange(amount);
    } else {
      setInternalPaymentAmount(amount);
    }
  };

  // Track previous order.id for uncontrolled mode reset
  const prevOrderIdRef = useRef(order.id);

  // Reset internal state when order changes (only relevant in uncontrolled mode)
  useEffect(() => {
    if (prevOrderIdRef.current === order.id) return;
    prevOrderIdRef.current = order.id;

    // Reset internal payments
    if (!externalPayments) {
      setInternalPayments([]);
      setInternalPaymentType("Cash");
      const orderTotal = Number(order.summ || 0);
      setInternalPaymentAmount(orderTotal);
    }
  }, [order.id]);

  // Load existing payments from order when in immediate mode
  useEffect(() => {
    if (mode === "immediate" && order.payments) {
      const paymentDTOs: PaymentDTO[] = order.payments.map(p => ({
        payment_type: p.payment_type,
        summ: Number(p.summ),
        delivery: p.delivery,
        transaction: p.transaction,
        ticket: p.ticket,
        data: p.data,
        card_id: null, // TODO: Extract from card if needed
      }));
      if (externalPayments) {
        onPaymentsChange?.(paymentDTOs);
      } else {
        setInternalPayments(paymentDTOs);
      }
    }
  }, [order.payments, mode]);

  // Calculate payment totals - use useMemo to avoid recalculating every render
  const totalPaid = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment?.summ ?? 0), 0),
    [payments]
  );
  const orderTotal = Number(order.summ || 0);
  const remaining = orderTotal - totalPaid;
  const isValid = Math.abs(remaining) < 0.01 && payments.length > 0;

  // Notify parent about validation + payments changes in a single effect
  const prevIsValidRef = useRef(isValid);
  const prevPaymentsLenRef = useRef(payments.length);

  useEffect(() => {
    // Only notify validation if it actually changed
    if (prevIsValidRef.current !== isValid) {
      prevIsValidRef.current = isValid;
      onPaymentsValidated?.(isValid);
    }

    // Only notify payments change if length actually changed
    if (prevPaymentsLenRef.current !== payments.length) {
      prevPaymentsLenRef.current = payments.length;
      onPaymentsChanged?.(payments);
    }
  }, [isValid, payments, onPaymentsValidated, onPaymentsChanged]);

  const handleAddPayment = async () => {
    // If parent wants to handle it, delegate to parent
    if (externalAddPayment) {
      externalAddPayment();
      return;
    }

    // Otherwise, handle internally
    const amount = newPaymentAmount;

    if (isNaN(amount) || amount <= 0) {
      showErrorToast(t("error.invalid_amount"));
      return;
    }

    try {
      const newPayment: PaymentDTO = {
        payment_type: newPaymentType,
        summ: amount,
        delivery: 0,
        transaction: "",
        ticket: "",
        data: "",
        card_id: null,
      };

      if (mode === "immediate") {
        // Save to backend immediately
        if (!order.id) {
          showErrorToast(t("error.no_order_selected"));
          return;
        }

        const response = await invoke<{ result?: { data: any }; error?: any }>(
          "ipc_add_payment_to_order",
          {
            params: {
              order_id: order.id,
              ...newPayment,
            },
          }
        );

        if (response.error) {
          throw new Error(response.error.message || "Failed to add payment");
        }

        // Payment added, will reload from order
        showSuccessToast(t("payment.payment_added"));
      } else {
        // Local mode - if controlled, call parent handler, otherwise update internal state
        const updated = [...payments, newPayment];
        if (externalPayments) {
          onPaymentsChange?.(updated);
        } else {
          setInternalPayments(updated);
        }
        showSuccessToast(t("payment.payment_added"));
      }

      handleAmountChange(0);
      handleTypeChange("Cash");
    } catch (error) {
      console.error("Failed to add payment:", error);
      showErrorToast(t("error.failed_to_add_payment"));
    }
  };

  const handleDeletePayment = async (index: number, paymentId?: string) => {
    try {
      if (mode === "immediate" && paymentId && order.id) {
        // Delete from backend
        await invoke("ipc_remove_payment_from_order", {
          orderId: order.id,
          paymentId: paymentId,
        });
        showSuccessToast(t("payment.payment_deleted"));
      } else {
        // Local mode - remove from state or notify parent
        const updated = payments.filter((_, i) => i !== index);
        if (externalPayments) {
          onPaymentsChange?.(updated);
        } else {
          setInternalPayments(updated);
        }
        showSuccessToast(t("payment.payment_deleted"));
      }
    } catch (error) {
      showErrorToast(t("error.failed_to_delete_payment"));
    }
  };

  const getPaymentTypeLabel = (type: PaymentType): string => {
    return t(`payment.type.${type.toLowerCase()}`);
  };

return (
  <Card className="w-full max-w-full overflow-hidden">
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left */}
        <div className="min-w-0">
          <CardTitle className="break-words">
            {t("payment.payments")}
          </CardTitle>
          <CardDescription className="break-words">
            {t("payment.add_payments_description")}
          </CardDescription>
        </div>

        {/* Right */}
        <div className="text-left sm:text-right space-y-1 min-w-0">
          <div className="text-sm text-muted-foreground break-words">
            {t("payment.total_paid")}:{" "}
            <span className="font-semibold">
              {totalPaid.toFixed(2)} {t("currency.sum")}
            </span>
          </div>

          <div className="text-sm text-muted-foreground break-words">
            {t("payment.order_total")}:{" "}
            <span className="font-semibold">
              {orderTotal.toFixed(2)} {t("currency.sum")}
            </span>
          </div>

          <div>
            {isValid ? (
              <Badge className="bg-green-500">
                {t("payment.payments_complete")}
              </Badge>
            ) : (
              <Badge variant="destructive" className="break-words">
                {t("payment.remaining")}:{" "}
                {Math.abs(remaining).toFixed(2)} {t("currency.sum")}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent className="overflow-x-hidden">
      {/* Existing Payments */}
      {payments.length > 0 && (
        <div className="space-y-2 mb-4">
          {payments.map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 p-3 border rounded-lg min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="truncate">
                  {getPaymentTypeLabel(payment.payment_type)}
                </Badge>
                <span className="font-medium truncate">
                  {Number(payment?.summ ?? 0).toFixed(2)} {t("currency.sum")}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePayment(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Payment */}
      <div className="space-y-4 border-t pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment-type">
              {t("payment.payment_type")}
            </Label>
            <Select
              value={newPaymentType}
              onValueChange={(value: string) =>
                handleTypeChange(value as PaymentType)
              }
            >
              <SelectTrigger id="payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {getPaymentTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 min-w-0">
  <Label htmlFor="payment-amount">{t("payment.amount")}</Label>

  <div className="min-w-0">
    <NumericInput
      value={newPaymentAmount}
      onChange={handleAmountChange}
      onEnterPress={handleAddPayment}
      placeholder="0.00"
      showNumpadButton
      className="w-full min-w-0 max-w-full text-sm sm:text-base"
    />
  </div>
</div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleAddPayment}
            disabled={newPaymentAmount <= 0}
            variant="outline"
            size="sm"
          >
            {t("payment.accept_payment")}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

}
