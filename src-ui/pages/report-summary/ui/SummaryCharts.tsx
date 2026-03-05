import type { OrderTypeTotals } from "@/shared/bindings/dtos/OrderTypeTotals";
import { formatAmount } from "@/shared/lib/format-amount";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SummaryChartsProps {
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
 * Three charts for the Summary Report, each showing unique insight:
 *
 * 1. «Доходы vs Расходы» — stacked bar: each order type contributes to revenue or expense side.
 *    Shows WHERE the money comes from and goes to — unlike OrderTypeBreakdown which shows raw
 *    numbers per type, this groups them by financial direction.
 *
 * 2. «Структура доходов / расходов» — two side-by-side donuts showing the % breakdown of
 *    revenue sources vs expense sources. OrderTypeBreakdown shows absolute amounts in cards —
 *    this shows proportional share visually.
 *
 * 3. «Сумма vs Налог vs Скидка» — comparative bar chart showing the ratio of net amount, tax
 *    and discount for each operation type. This perspective is not available in any other component.
 */
export function SummaryCharts({
  totalIncoming,
  totalOutgoing,
  netFlow,
  totalsByType,
}: SummaryChartsProps) {
  const { t } = useTranslation();

  /* ────────── Chart 1 data: Revenue vs Expense breakdown ────────── */
  const flowData = useMemo(() => {
    const sale = totalsByType.saleSum + totalsByType.saleTax;
    const retProv = totalsByType.outcomeSum + totalsByType.outcomeTax;
    const purchase = totalsByType.incomeSum + totalsByType.incomeTax;
    const retCust = totalsByType.returnsSum + totalsByType.returnsTax;

    return [
      {
        name: t("order.revenue", "Доходы"),
        sale,
        retProv,
        total: sale + retProv,
      },
      {
        name: t("order.expenses", "Расходы"),
        purchase,
        retCust,
        total: purchase + retCust,
      },
    ];
  }, [totalsByType, t]);

  /* ────────── Chart 2 data: two donuts ────────── */
  const revenueBreakdown = useMemo(() => {
    const items = [
      {
        name: t("order.type.sale", "Продажа"),
        value: totalsByType.saleSum + totalsByType.saleTax,
        color: "#10b981",
      },
      {
        name: t("order.type.return_provider", "Возврат поставщику"),
        value: totalsByType.outcomeSum + totalsByType.outcomeTax,
        color: "#ea580c",
      },
    ].filter((i) => i.value > 0);
    return items;
  }, [totalsByType, t]);

  const expenseBreakdown = useMemo(() => {
    const items = [
      {
        name: t("order.type.purchase", "Закупка"),
        value: totalsByType.incomeSum + totalsByType.incomeTax,
        color: "#2563eb",
      },
      {
        name: t("order.type.customer_return", "Возврат покупателя"),
        value: totalsByType.returnsSum + totalsByType.returnsTax,
        color: "#dc2626",
      },
    ].filter((i) => i.value > 0);
    return items;
  }, [totalsByType, t]);

  /* ────────── Chart 3 data: Sum / Tax / Discount per type ────────── */
  const taxDiscountData = useMemo(() => {
    return [
      {
        type: t("order.type.sale_short", "Продажа"),
        sum: totalsByType.saleSum,
        tax: totalsByType.saleTax,
        discount: totalsByType.saleDiscount,
      },
      {
        type: t("order.type.purchase_short", "Закупка"),
        sum: totalsByType.incomeSum,
        tax: totalsByType.incomeTax,
        discount: totalsByType.incomeDiscount,
      },
      {
        type: t("order.type.return_prov_short", "Возвр. пост."),
        sum: totalsByType.outcomeSum,
        tax: totalsByType.outcomeTax,
        discount: totalsByType.outcomeDiscount,
      },
      {
        type: t("order.type.return_cust_short", "Возвр. покуп."),
        sum: totalsByType.returnsSum,
        tax: totalsByType.returnsTax,
        discount: totalsByType.returnsDiscount,
      },
    ].filter((i) => i.sum + i.tax + i.discount > 0);
  }, [totalsByType, t]);

  const totalDiscount = taxDiscountData.reduce((s, i) => s + i.discount, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
      {/* ═══ Chart 1: Revenue vs Expenses — stacked breakdown ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="text-gray-700 dark:text-gray-200">
              {t("order.revenue_vs_expense", "Доходы vs Расходы")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={flowData}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis tickFormatter={(v) => fmtCompact(v)} fontSize={10} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${formatAmount(value)} ${t("currency.sum", "сум")}`,
                    name,
                  ]}
                />
                <Legend />
                {/* Revenue bars */}
                <Bar dataKey="sale" stackId="stack" fill="#10b981" name={t("order.type.sale", "Продажа")} radius={[0, 0, 0, 0]} />
                <Bar dataKey="fuel" stackId="stack" fill="#059669" name={t("order.type.fuel_sale", "ГСМ")} />
                <Bar dataKey="retProv" stackId="stack" fill="#ea580c" name={t("order.type.return_provider", "Возвр. пост.")} radius={[4, 4, 0, 0]} />
                {/* Expense bars */}
                <Bar dataKey="purchase" stackId="stack" fill="#2563eb" name={t("order.type.purchase", "Закупка")} />
                <Bar dataKey="retCust" stackId="stack" fill="#dc2626" name={t("order.type.customer_return", "Возвр. покуп.")} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Net flow summary */}
          <div className={`mt-3 p-3 rounded-lg border text-center ${
            netFlow >= 0
              ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700"
              : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700"
          }`}>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t("order.net_flow", "Чистый поток")}:{" "}
            </span>
            <span className={`text-lg font-bold ${
              netFlow >= 0
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}>
              {netFlow >= 0 ? "+" : ""}{formatAmount(netFlow)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Chart 2: Revenue / Expense structure — two donuts ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <PieChartIcon className="h-5 w-5 text-indigo-600" />
            <span className="text-gray-700 dark:text-gray-200">
              {t("order.flow_structure", "Структура потока")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {/* Revenue donut */}
            <div>
              <p className="text-xs font-semibold text-center text-green-700 dark:text-green-300 mb-1">
                {t("order.revenue", "Доходы")}
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`rev-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${formatAmount(value)} ${t("currency.sum", "сум")}`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-1">
                {revenueBreakdown.map((item) => {
                  const total = revenueBreakdown.reduce((s, i) => s + i.value, 0);
                  return (
                    <MiniLegend
                      key={item.name}
                      color={item.color}
                      label={item.name}
                      pct={total > 0 ? ((item.value / total) * 100).toFixed(0) : "0"}
                    />
                  );
                })}
              </div>
            </div>

            {/* Expense donut */}
            <div>
              <p className="text-xs font-semibold text-center text-red-700 dark:text-red-300 mb-1">
                {t("order.expenses", "Расходы")}
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`exp-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${formatAmount(value)} ${t("currency.sum", "сум")}`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-1">
                {expenseBreakdown.map((item) => {
                  const total = expenseBreakdown.reduce((s, i) => s + i.value, 0);
                  return (
                    <MiniLegend
                      key={item.name}
                      color={item.color}
                      label={item.name}
                      pct={total > 0 ? ((item.value / total) * 100).toFixed(0) : "0"}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Revenue vs Expense totals */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700">
              <div className="font-semibold text-green-700 dark:text-green-300">
                {formatAmount(totalIncoming)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {t("order.total_revenue", "Итого доходы")}
              </div>
            </div>
            <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700">
              <div className="font-semibold text-red-700 dark:text-red-300">
                {formatAmount(totalOutgoing)}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                {t("order.total_expenses", "Итого расходы")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Chart 3: Sum / Tax / Discount per type ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="text-gray-700 dark:text-gray-200">
              {t("order.tax_discount_analysis", "Налоги и скидки")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taxDiscountData}
                margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-35} textAnchor="end" height={70} fontSize={10} />
                <YAxis tickFormatter={(v) => fmtCompact(v)} fontSize={10} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${formatAmount(value)} ${t("currency.sum", "сум")}`,
                    name,
                  ]}
                />
                <Legend />
                <Bar dataKey="sum" fill="#3b82f6" name={t("order.amount", "Сумма")} radius={[0, 0, 0, 0]} />
                <Bar dataKey="tax" fill="#10b981" name={t("order.tax", "Налог")} />
                {totalDiscount > 0 && (
                  <Bar dataKey="discount" fill="#f59e0b" name={t("order.discount_label", "Скидка")} radius={[2, 2, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Totals */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/10 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={`grid ${totalDiscount > 0 ? "grid-cols-3" : "grid-cols-2"} gap-3 text-sm`}>
              <div className="text-center">
                <div className="font-semibold text-blue-700 dark:text-blue-300">
                  {formatAmount(taxDiscountData.reduce((s, i) => s + i.sum, 0))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("order.total_amount", "Общая сумма")}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-700 dark:text-green-300">
                  {formatAmount(taxDiscountData.reduce((s, i) => s + i.tax, 0))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("order.total_tax", "Общий налог")}
                </div>
              </div>
              {totalDiscount > 0 && (
                <div className="text-center">
                  <div className="font-semibold text-amber-700 dark:text-amber-300">
                    {formatAmount(totalDiscount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("order.total_discount", "Общая скидка")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────── Internal helpers ──────────────────── */

function fmtCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}G`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function MiniLegend({
  color,
  label,
  pct,
}: {
  color: string;
  label: string;
  pct: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs px-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-gray-600 dark:text-gray-300 truncate">{label}</span>
      </div>
      <span className="font-medium text-gray-700 dark:text-gray-200 ml-1">{pct}%</span>
    </div>
  );
}
