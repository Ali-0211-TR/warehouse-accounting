import { orderApi } from "@/entities/order/api/order-api";
import { initOrderFilter } from "@/entities/order/model/schemas";
import type { ShiftEntity } from "@/entities/shift";
import type { OrderMovementSummaryMeta } from "@/shared/bindings/dtos/OrderMovementSummaryMeta";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Separator } from "@/shared/ui/shadcn/separator";
import { t } from "i18next";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ShiftFinancialSummaryProps {
  shift: ShiftEntity;
}

export function ShiftFinancialSummary({ shift }: ShiftFinancialSummaryProps) {
  const [meta, setMeta] = useState<OrderMovementSummaryMeta | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFinancialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dClose = shift.d_close ?? new Date().toISOString();
        const result = await orderApi.getMovementReport({
          first: 0,
          rows: 1, // We only need the meta, not the items
          page: 1,
          sort_field: "DCreated",
          sort_order: "Desc",
          filters: {
            ...initOrderFilter,
            d_move: [shift.d_open, dClose] as [string, string],
          },
        });
        setMeta(result.meta);
        setOrderCount(result.count);
      } catch (e: any) {
        setError(e.message || "Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, [shift.id, shift.d_open, shift.d_close]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            {t("common.loading", "Загрузка...")}
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!meta) return null;

  const totalsByType = meta.totalsByType;
  const netFlow = meta.totalSum;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
          {t("shift.financial_summary", "Финансовая сводка за смену")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main financial metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Incoming */}
          <div className="p-3 bg-green-50 dark:bg-green-900/15 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">
                {t("order.total_incoming", "Приход денег")}
              </span>
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatAmount(meta.totalIncoming)}
            </p>
          </div>

          {/* Total Outgoing */}
          <div className="p-3 bg-red-50 dark:bg-red-900/15 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-800 dark:text-red-200">
                {t("order.total_outgoing", "Расход денег")}
              </span>
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatAmount(meta.totalOutgoing)}
            </p>
          </div>

          {/* Net Cash Flow */}
          <div className={`p-3 rounded-lg border ${
            netFlow >= 0
              ? "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-700"
              : "bg-orange-50 dark:bg-orange-900/15 border-orange-200 dark:border-orange-700"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`h-4 w-4 ${netFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`} />
              <span className={`text-xs font-medium ${netFlow >= 0 ? "text-emerald-800 dark:text-emerald-200" : "text-orange-800 dark:text-orange-200"}`}>
                {t("order.net_cash_flow", "Чистый поток")}
              </span>
            </div>
            <p className={`text-lg font-bold ${netFlow >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-orange-700 dark:text-orange-300"}`}>
              {netFlow >= 0 ? "+" : ""}{formatAmount(netFlow)}
            </p>
          </div>

          {/* Order Count */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/15 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                {t("order.order_count", "Кол-во ордеров")}
              </span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {orderCount}
            </p>
          </div>
        </div>

        <Separator />

        {/* Breakdown by order type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Regular Sales */}
          {(totalsByType.saleSum > 0 || totalsByType.saleTax > 0) && (
            <div className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-medium text-green-800 dark:text-green-200">
                  {t("order.type.sale", "Продажа")}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.summ")}:</span>
                  <span className="font-mono font-semibold">{formatAmount(totalsByType.saleSum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.tax")}:</span>
                  <span className="font-mono">{formatAmount(totalsByType.saleTax)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">{t("order.total")}:</span>
                  <span className="font-mono font-bold">{formatAmount(totalsByType.saleSum + totalsByType.saleTax)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Purchases (Income) */}
          {(totalsByType.incomeSum > 0 || totalsByType.incomeTax > 0) && (
            <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowDownCircle className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  {t("order.type.purchase", "Закупка")}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.summ")}:</span>
                  <span className="font-mono font-semibold">{formatAmount(totalsByType.incomeSum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.tax")}:</span>
                  <span className="font-mono">{formatAmount(totalsByType.incomeTax)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">{t("order.total")}:</span>
                  <span className="font-mono font-bold">{formatAmount(totalsByType.incomeSum + totalsByType.incomeTax)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Returns to Provider (Outcome) */}
          {(totalsByType.outcomeSum > 0 || totalsByType.outcomeTax > 0) && (
            <div className="p-3 border rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowUpCircle className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                  {t("order.type.return_provider", "Возврат поставщику")}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.summ")}:</span>
                  <span className="font-mono font-semibold">{formatAmount(totalsByType.outcomeSum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.tax")}:</span>
                  <span className="font-mono">{formatAmount(totalsByType.outcomeTax)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">{t("order.total")}:</span>
                  <span className="font-mono font-bold">{formatAmount(totalsByType.outcomeSum + totalsByType.outcomeTax)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Returns */}
          {(totalsByType.returnsSum > 0 || totalsByType.returnsTax > 0) && (
            <div className="p-3 border rounded-lg bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-700">
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-medium text-red-800 dark:text-red-200">
                  {t("order.type.customer_return", "Возврат от покупателя")}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.summ")}:</span>
                  <span className="font-mono font-semibold">{formatAmount(totalsByType.returnsSum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("order.tax")}:</span>
                  <span className="font-mono">{formatAmount(totalsByType.returnsTax)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">{t("order.total")}:</span>
                  <span className="font-mono font-bold">{formatAmount(totalsByType.returnsSum + totalsByType.returnsTax)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Show message if no operations */}
          {orderCount === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-4">
              {t("shift.no_operations", "Нет операций за эту смену")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
