import type { OrderTypeTotals } from "@/shared/bindings/dtos/OrderTypeTotals";
import { formatAmount } from "@/shared/lib/format-amount";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  ArrowDownCircle,
  BarChart3,
  Calculator,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface SummaryBusinessIntelligenceProps {
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
 * Business Intelligence summary — 4 unique metric cards:
 *
 * 1. Рентабельность (period)     — ROI, revenue per expense, cost recovery
 * 2. Налоговая нагрузка (period) — tax as % of revenue, tax by type
 * 3. Структура операций (period) — share of sales / purchases / fuel in total
 * 4. Эффективность запасов (snapshot) — markup, margin, inventory turnover potential
 *
 * No duplication with SummaryFinancialOverview (which shows absolute amounts)
 * or SummaryCharts (which shows visual breakdowns).
 */
export function SummaryBusinessIntelligence({
  totalIncoming,
  totalOutgoing,
  netFlow,
  totalsByType,
  totalSaleProduct,
  totalIncomeProduct,
  productCount,
}: SummaryBusinessIntelligenceProps) {
  const { t } = useTranslation();

  // ── Period-based calculations ──
  const revenuePerExpense = totalOutgoing > 0 ? totalIncoming / totalOutgoing : 0;
  const costRecovery = totalOutgoing > 0 ? ((totalIncoming - totalOutgoing) / totalOutgoing) * 100 : 0;

  // Tax analysis
  const totalTax =
    totalsByType.saleTax +
    totalsByType.incomeTax +
    totalsByType.outcomeTax +
    totalsByType.returnsTax;
  const totalAmount =
    totalsByType.saleSum +
    totalsByType.incomeSum +
    totalsByType.outcomeSum +
    totalsByType.returnsSum;
  const avgTaxRate = totalAmount > 0 ? (totalTax / totalAmount) * 100 : 0;
  const taxOnRevenue = totalIncoming > 0 ? (totalTax / totalIncoming) * 100 : 0;

  // Total discount
  const totalDiscount =
    totalsByType.saleDiscount +
    totalsByType.incomeDiscount +
    totalsByType.outcomeDiscount +
    totalsByType.returnsDiscount;

  // Operations structure
  const totalVolume = totalIncoming + totalOutgoing;
  const saleShare = totalVolume > 0
    ? (((totalsByType.saleSum + totalsByType.saleTax) / totalVolume) * 100)
    : 0;
  const purchaseShare = totalVolume > 0
    ? (((totalsByType.incomeSum + totalsByType.incomeTax) / totalVolume) * 100)
    : 0;

  // ── Inventory snapshot ──
  const inventoryMarkup = totalIncomeProduct > 0
    ? ((totalSaleProduct - totalIncomeProduct) / totalIncomeProduct) * 100
    : 0;
  const inventoryPotentialProfit = totalSaleProduct - totalIncomeProduct;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Calculator className="h-5 w-5 text-indigo-600" />
          <span className="text-gray-700 dark:text-gray-200">
            {t("order.business_intelligence", "Бизнес-аналитика")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* ═══ 1. Profitability (period) ═══ */}
          <BICard
            title={t("order.profitability", "Рентабельность")}
            subtitle={t("order.period_data", "За период")}
            icon={<Calculator className="h-5 w-5 text-blue-600" />}
            gradient="from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10"
            borderColor="border-blue-200 dark:border-blue-700"
            titleClass="text-blue-800 dark:text-blue-300"
            rows={[
              {
                label: t("order.revenue_per_expense", "Доход / Расход"),
                value: revenuePerExpense > 0 ? `${revenuePerExpense.toFixed(2)}×` : "—",
                valueClass: revenuePerExpense >= 1
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300",
              },
              {
                label: t("order.cost_recovery", "Окупаемость затрат"),
                value: totalOutgoing > 0 ? `${costRecovery >= 0 ? "+" : ""}${costRecovery.toFixed(1)}%` : "—",
                valueClass: costRecovery >= 0
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300",
              },
              {
                label: t("order.net_result", "Чистый результат"),
                value: `${netFlow >= 0 ? "+" : ""}${fmtCompact(netFlow)}`,
                valueClass: netFlow >= 0
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-red-700 dark:text-red-300",
              },
            ]}
          />

          {/* ═══ 2. Tax & Discount burden (period) ═══ */}
          <BICard
            title={t("order.tax_burden", "Налоговая нагрузка")}
            subtitle={t("order.period_data", "За период")}
            icon={<ArrowDownCircle className="h-5 w-5 text-amber-600" />}
            gradient="from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10"
            borderColor="border-amber-200 dark:border-amber-700"
            titleClass="text-amber-800 dark:text-amber-300"
            rows={[
              {
                label: t("order.avg_tax_rate", "Ср. ставка налога"),
                value: totalAmount > 0 ? `${avgTaxRate.toFixed(1)}%` : "—",
                valueClass: "text-amber-700 dark:text-amber-300",
              },
              {
                label: t("order.tax_to_revenue", "Налог к доходам"),
                value: totalIncoming > 0 ? `${taxOnRevenue.toFixed(1)}%` : "—",
                valueClass: "text-amber-700 dark:text-amber-300",
              },
              {
                label: t("order.total_tax", "Всего налогов"),
                value: formatAmount(totalTax),
                valueClass: "text-amber-700 dark:text-amber-300",
              },
              ...(totalDiscount > 0
                ? [{
                    label: t("order.total_discount", "Всего скидок"),
                    value: formatAmount(totalDiscount),
                    valueClass: "text-orange-700 dark:text-orange-300",
                  }]
                : []),
            ]}
          />

          {/* ═══ 3. Operations structure (period) ═══ */}
          <BICard
            title={t("order.operations_structure", "Структура операций")}
            subtitle={t("order.period_data", "За период")}
            icon={<BarChart3 className="h-5 w-5 text-green-600" />}
            gradient="from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
            borderColor="border-green-200 dark:border-green-700"
            titleClass="text-green-800 dark:text-green-300"
            rows={[
              {
                label: t("order.type.sale", "Продажи"),
                value: `${saleShare.toFixed(1)}%`,
                valueClass: "text-green-700 dark:text-green-300",
                bar: { pct: saleShare, color: "bg-green-500" },
              },
              {
                label: t("order.type.purchase", "Закупки"),
                value: `${purchaseShare.toFixed(1)}%`,
                valueClass: "text-blue-700 dark:text-blue-300",
                bar: { pct: purchaseShare, color: "bg-blue-500" },
              },
            ]}
          />

          {/* ═══ 4. Inventory Performance (snapshot) ═══ */}
          <BICard
            title={t("product.inventory_performance", "Эффективность запасов")}
            subtitle={t("product.current_state", "На текущий момент")}
            icon={<Package className="h-5 w-5 text-purple-600" />}
            gradient="from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10"
            borderColor="border-purple-200 dark:border-purple-700"
            titleClass="text-purple-800 dark:text-purple-300"
            rows={[
              {
                label: t("product.markup_percentage", "Наценка"),
                value: totalIncomeProduct > 0 ? `${inventoryMarkup.toFixed(1)}%` : "—",
                valueClass: inventoryMarkup > 0
                  ? "text-green-700 dark:text-green-300"
                  : "text-purple-700 dark:text-purple-300",
              },
              {
                label: t("product.potential_profit", "Потенц. прибыль"),
                value: formatAmount(inventoryPotentialProfit),
                valueClass: inventoryPotentialProfit > 0
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300",
              },
              {
                label: t("product.total_products", "Кол-во товаров"),
                value: String(productCount),
                valueClass: "text-purple-700 dark:text-purple-300",
              },
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────── Internal helpers ──────────────────── */

function fmtCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} млрд`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} млн`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} тыс`;
  return value.toFixed(0);
}

interface BIRow {
  label: string;
  value: string;
  valueClass: string;
  bar?: { pct: number; color: string };
}

function BICard({
  title,
  subtitle,
  icon,
  gradient,
  borderColor,
  titleClass,
  rows,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  titleClass: string;
  rows: BIRow[];
}) {
  return (
    <div className={`p-4 bg-gradient-to-r ${gradient} rounded-lg border ${borderColor}`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className={`font-medium ${titleClass}`}>{title}</h4>
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
        {subtitle}
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{row.label}:</span>
              <span className={`font-semibold ${row.valueClass}`}>{row.value}</span>
            </div>
            {row.bar && (
              <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.bar.color}`}
                  style={{ width: `${Math.min(row.bar.pct, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
