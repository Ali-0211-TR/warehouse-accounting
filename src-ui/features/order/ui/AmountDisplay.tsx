import { OrderType } from "@/shared/bindings/OrderType";
import { Minus, Plus } from "lucide-react";
import React from "react";

// Helper function to determine if amount should be displayed as negative
const getAmountMultiplier = (orderType: OrderType): number => {
  // Returns -1 for money outgoing transactions, 1 for money incoming
  switch (orderType) {
    case "Income": // We pay money to provider
    case "Returns": // We give money back to customer
      return -1;
    case "Outcome": // Provider gives money back to us
    case "Sale": // Customer pays us
      return 1;
    default:
      return 1;
  }
};
// Memoized amount display component
export const AmountDisplay = React.memo(
  ({
    amount,
    orderType,
    formatAmount,
    showCurrency = true,
  }: {
    amount: number;
    orderType: OrderType;
    formatAmount: (amount: number) => string;
    showCurrency?: boolean;
  }) => {
    const multiplier = getAmountMultiplier(orderType);
    const displayAmount = amount * multiplier;
    const isNegative = displayAmount < 0;

    return (
      <div className="flex items-center justify-end space-x-1">
        {/* <DollarSign
          className={`h-4 w-4 ${
            isNegative ? "text-red-600" : "text-emerald-600"
          }`}
        /> */}
        <div className="text-right">
          <div
            className={`font-medium text-sm flex items-center justify-end ${
              isNegative ? "text-red-700" : "text-emerald-700"
            }`}
          >
            {isNegative ? (
              <Minus className="h-3 w-3 mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            {formatAmount(Math.abs(displayAmount))}
          </div>
          {showCurrency && (
            <div className="text-xs text-muted-foreground">
              {isNegative ? "Outgoing" : "Incoming"}
            </div>
          )}
        </div>
      </div>
    );
  }
);
AmountDisplay.displayName = "AmountDisplay";
