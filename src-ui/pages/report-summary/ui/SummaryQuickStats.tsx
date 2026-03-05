import type { OrderTypeTotals } from "@/shared/bindings/dtos/OrderTypeTotals";
import { formatAmount } from "@/shared/lib/format-amount";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  BarChart3,
  DollarSign,
  PieChart as PieChartIcon,
  ReceiptIcon,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface SummaryQuickStatsProps {
  ordersCount: number;
  totalSum: number;
  totalTax: number;
  totalDiscount: number;
  // Period-filtered
  totalIncoming: number;
  totalOutgoing: number;
  netFlow: number;
  profitMargin: number;
  totalsByType: OrderTypeTotals;
}

/**
 * Quick Stats card + Financial Health card for the Summary Report.
 * All data here is period-based (filtered by selected shift/date).
 * No inventory data is mixed in.
 */
export function SummaryQuickStats({
  ordersCount,
  totalSum,
  totalTax,
  totalDiscount,
  totalIncoming,
  totalOutgoing,
  netFlow,
  profitMargin,
  totalsByType,
}: SummaryQuickStatsProps) {
  const { t } = useTranslation();

  // Revenue share %
  const totalFlow = totalIncoming + totalOutgoing;
  const revenueShare = totalFlow > 0 ? (totalIncoming / totalFlow) * 100 : 0;
  const expenseShare = totalFlow > 0 ? (totalOutgoing / totalFlow) * 100 : 0;

  // Revenue-to-expense ratio
  const revenueToExpense = totalOutgoing > 0 ? totalIncoming / totalOutgoing : 0;

  return (
    <>
      {/* Quick Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-purple-600" />
            <span className="text-gray-700 dark:text-gray-200">
              {t("order.quick_stats", "Краткая статистика")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow
            icon={<Badge variant="secondary" className="mr-2 h-4 w-4 p-0 flex items-center justify-center">#</Badge>}
            label={t("order.total_orders", "Всего операций")}
          >
            <Badge variant="outline" className="font-semibold">
              {ordersCount}
            </Badge>
          </StatRow>

          <StatRow
            icon={<ReceiptIcon className="h-4 w-4" />}
            label={t("order.gross_amount", "Общая сумма")}
          >
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {formatAmount(Math.abs(totalSum))}
            </span>
          </StatRow>

          <StatRow
            icon={<DollarSign className="h-4 w-4" />}
            label={t("order.total_tax", "Общий налог")}
          >
            <span className="font-semibold text-green-700 dark:text-green-300">
              {formatAmount(Math.abs(totalTax))}
            </span>
          </StatRow>

          {totalDiscount > 0 && (
            <StatRow
              icon={null}
              label={t("order.total_discount", "Общая скидка")}
            >
              <span className="font-semibold text-orange-700 dark:text-orange-300">
                {formatAmount(totalDiscount)}
              </span>
            </StatRow>
          )}

          <StatRow
            icon={<BarChart3 className="h-4 w-4" />}
            label={t("order.avg_order", "Средний чек")}
          >
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {ordersCount > 0 ? formatAmount(Math.abs(totalSum) / ordersCount) : "0"}
            </span>
          </StatRow>

          {/* Transaction breakdown */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/15 rounded">
                <div className="font-semibold text-green-700 dark:text-green-300">
                  {(totalsByType.saleSum > 0 ? 1 : 0) +
                    (totalsByType.outcomeSum > 0 ? 1 : 0)}
                </div>
                <div className="text-green-600 dark:text-green-300">
                  {t("order.revenue_types", "Типы доходов")}
                </div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/15 rounded">
                <div className="font-semibold text-red-700 dark:text-red-300">
                  {(totalsByType.incomeSum > 0 ? 1 : 0) +
                    (totalsByType.returnsSum > 0 ? 1 : 0)}
                </div>
                <div className="text-red-600 dark:text-red-300">
                  {t("order.expense_types", "Типы расходов")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <span className="text-gray-700 dark:text-gray-200">
              {t("order.financial_health", "Финансовое состояние")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Profit margin — key metric */}
          <div className="text-center">
            <div
              className={`text-3xl font-bold ${
                netFlow >= 0
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-red-600 dark:text-red-300"
              }`}
            >
              {profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t("order.profit_margin_label", "Маржа прибыли")}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("order.net_flow_div_revenue", "Чистый поток ÷ Доходы")}
            </p>
          </div>

          {/* Performance Indicators */}
          <div className="space-y-2">
            <IndicatorRow
              color="bg-green-500 dark:bg-green-400"
              label={t("order.revenue_share", "Доля доходов")}
              value={`${revenueShare.toFixed(1)}%`}
              valueClass="text-green-600 dark:text-green-300"
            />
            <IndicatorRow
              color="bg-red-500 dark:bg-red-400"
              label={t("order.expense_share", "Доля расходов")}
              value={`${expenseShare.toFixed(1)}%`}
              valueClass="text-red-600 dark:text-red-300"
            />
            <IndicatorRow
              color="bg-blue-500 dark:bg-blue-400"
              label={t("order.revenue_to_expense", "Доход / Расход")}
              value={revenueToExpense > 0 ? `${revenueToExpense.toFixed(2)}x` : "—"}
              valueClass="text-blue-600 dark:text-blue-300"
            />
          </div>

          {/* Status */}
          <div className="mt-3 pt-3 border-t">
            <div
              className={`text-center text-sm font-medium p-2 rounded-lg ${
                netFlow >= 0
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700"
                  : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
              }`}
            >
              {netFlow >= 0 ? (
                <div className="flex items-center justify-center space-x-1">
                  <span>💰</span>
                  <span>{t("order.positive_flow", "Положительный поток")}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-1">
                  <span>⚠️</span>
                  <span>{t("order.negative_flow", "Отрицательный поток")}</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              {netFlow >= 0 ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-300">
                  {revenueToExpense > 1.5
                    ? t("order.excellent_position", "🚀 Доходы значительно превышают расходы")
                    : revenueToExpense > 1.2
                      ? t("order.strong_position", "✅ Хороший баланс доходов и расходов")
                      : t("order.stable_position", "📈 Доходы покрывают расходы")}
                </p>
              ) : (
                <p className="text-xs text-red-600 dark:text-red-300">
                  {t("order.improvement_needed", "📉 Расходы превышают доходы")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ──────────────────── Internal helpers ──────────────────── */

function StatRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function IndicatorRow({
  color,
  label,
  value,
  valueClass,
}: {
  color: string;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-300 flex items-center">
        <span className={`w-3 h-3 rounded-full mr-2 ${color}`} />
        {label}
      </span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
