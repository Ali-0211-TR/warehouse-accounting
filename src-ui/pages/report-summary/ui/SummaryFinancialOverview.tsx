import type { OrderTypeTotals } from "@/shared/bindings/dtos/OrderTypeTotals";
import { formatAmount } from "@/shared/lib/format-amount";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  Calculator,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface SummaryFinancialOverviewProps {
  // Period-filtered order data
  totalIncoming: number;
  totalOutgoing: number;
  netFlow: number;
  profitMargin: number;
  totalsByType: OrderTypeTotals;
  // Inventory snapshot (current state)
  totalSaleProduct: number;
  totalIncomeProduct: number;
  productCount: number;
}

/**
 * Top-level financial overview card (left 2-column span).
 *
 * Clearly separates:
 * - Period-based order data (Revenue, Expenses, Net flow) — filtered by selected shift/date
 * - Current inventory snapshot (Cost, Value, Potential profit) — always current state
 */
export function SummaryFinancialOverview({
  totalIncoming,
  totalOutgoing,
  netFlow,
  profitMargin,
  totalsByType,
  totalSaleProduct,
  totalIncomeProduct,
  productCount,
}: SummaryFinancialOverviewProps) {
  const { t } = useTranslation();

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
          <span className="text-gray-700 dark:text-gray-200">
            {t("order.financial_overview", "Финансовый обзор")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ═══ SECTION 1: Period-based order data ═══ */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("order.period_results", "Результаты за период")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Revenue */}
            <MetricCard
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              iconBg="bg-green-100 dark:bg-green-800"
              cardBg="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              label={t("order.revenue", "Доходы")}
              value={formatAmount(totalIncoming)}
              valueClass="text-green-700 dark:text-green-300"
              description={t("order.revenue_description", "Продажи + Возврат поставщику")}
              descClass="text-green-600 dark:text-green-300"
            />

            {/* Expenses */}
            <MetricCard
              icon={<TrendingDown className="h-4 w-4 text-red-600" />}
              iconBg="bg-red-100 dark:bg-red-800"
              cardBg="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
              label={t("order.expenses", "Расходы")}
              value={formatAmount(totalOutgoing)}
              valueClass="text-red-700 dark:text-red-300"
              description={t("order.expenses_description", "Закупки + Возврат от покупателей")}
              descClass="text-red-600 dark:text-red-300"
            />

            {/* Net Cash Flow */}
            <div
              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                netFlow >= 0
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                  : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
              }`}
            >
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <span
                    className={`p-1 rounded-full ${
                      netFlow >= 0
                        ? "bg-emerald-100 dark:bg-emerald-800"
                        : "bg-orange-100 dark:bg-orange-800"
                    }`}
                  >
                    <TrendingUp
                      className={`h-4 w-4 ${
                        netFlow >= 0 ? "text-emerald-600" : "text-orange-600"
                      }`}
                    />
                  </span>
                  {t("order.net_cash_flow", "Чистый денежный поток")}
                </p>
                <p
                  className={`text-lg font-bold ${
                    netFlow >= 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-orange-700 dark:text-orange-300"
                  }`}
                >
                  {netFlow >= 0 ? "+" : ""}
                  {formatAmount(netFlow)}
                </p>
                <p
                  className={`text-xs ${
                    netFlow >= 0
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-orange-600 dark:text-orange-300"
                  }`}
                >
                  {t("order.profit_margin_label", "Маржа")}: {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: Current inventory snapshot ═══ */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {t("product.current_inventory", "Текущие запасы")}
            <span className="text-[10px] font-normal text-muted-foreground">
              ({t("product.current_state", "на текущий момент")})
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Inventory Cost */}
            <MetricCard
              icon={<Package className="h-4 w-4 text-blue-600" />}
              iconBg="bg-blue-100 dark:bg-blue-800"
              cardBg="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
              label={t("product.inventory_cost", "Себестоимость")}
              value={formatAmount(totalIncomeProduct)}
              valueClass="text-blue-700 dark:text-blue-300"
              description={`${productCount} ${t("product.products_label", "товаров")}`}
              descClass="text-blue-600 dark:text-blue-300"
            />

            {/* Inventory Value */}
            <MetricCard
              icon={<Package className="h-4 w-4 text-purple-600" />}
              iconBg="bg-purple-100 dark:bg-purple-800"
              cardBg="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
              label={t("product.inventory_value", "Стоимость запасов")}
              value={formatAmount(totalSaleProduct)}
              valueClass="text-purple-700 dark:text-purple-300"
              description={t("product.at_sale_prices", "По ценам продажи")}
              descClass="text-purple-600 dark:text-purple-300"
            />

            {/* Potential Profit */}
            <MetricCard
              icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
              iconBg="bg-indigo-100 dark:bg-indigo-800"
              cardBg="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700"
              label={t("product.potential_profit", "Потенциальная прибыль")}
              value={formatAmount(totalSaleProduct - totalIncomeProduct)}
              valueClass="text-indigo-700 dark:text-indigo-300"
              description={
                totalIncomeProduct > 0
                  ? `${t("product.margin_percentage", "Маржа")}: ${(((totalSaleProduct - totalIncomeProduct) / totalIncomeProduct) * 100).toFixed(1)}%`
                  : ""
              }
              descClass="text-indigo-600 dark:text-indigo-300"
            />
          </div>
        </div>

        {/* ═══ SECTION 3: Revenue / Expense sources ═══ */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            {/* Revenue Sources */}
            <div className="space-y-2">
              <h4 className="font-medium text-green-700 dark:text-green-300 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {t("order.revenue_sources", "Источники доходов")}
              </h4>
              <div className="space-y-1 pl-5">
                <RowItem
                  label={t("order.customer_sales", "Продажи")}
                  value={formatAmount(
                    totalsByType.saleSum +
                      totalsByType.saleTax,
                  )}
                  valueClass="text-green-700 dark:text-green-300"
                />
                <RowItem
                  label={t("order.provider_returns", "Возврат поставщику")}
                  value={formatAmount(totalsByType.outcomeSum + totalsByType.outcomeTax)}
                  valueClass="text-green-700 dark:text-green-300"
                />
              </div>
            </div>

            {/* Expense Sources */}
            <div className="space-y-2">
              <h4 className="font-medium text-red-700 dark:text-red-300 flex items-center">
                <TrendingDown className="h-4 w-4 mr-1" />
                {t("order.expense_sources", "Источники расходов")}
              </h4>
              <div className="space-y-1 pl-5">
                <RowItem
                  label={t("order.purchases", "Закупки")}
                  value={formatAmount(totalsByType.incomeSum + totalsByType.incomeTax)}
                  valueClass="text-red-700 dark:text-red-300"
                />
                <RowItem
                  label={t("order.customer_returns", "Возврат от покупателей")}
                  value={formatAmount(totalsByType.returnsSum + totalsByType.returnsTax)}
                  valueClass="text-red-700 dark:text-red-300"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────── Internal helper components ──────────────────── */

function MetricCard({
  icon,
  iconBg,
  cardBg,
  label,
  value,
  valueClass,
  description,
  descClass,
}: {
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
  label: string;
  value: string;
  valueClass: string;
  description: string;
  descClass: string;
}) {
  return (
    <div className={`flex items-start space-x-3 p-3 rounded-lg border ${cardBg}`}>
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <span className={`p-1 rounded-full ${iconBg}`}>{icon}</span>
          {label}
        </p>
        <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
        {description && <p className={`text-xs ${descClass}`}>{description}</p>}
      </div>
    </div>
  );
}

function RowItem({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}:</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
