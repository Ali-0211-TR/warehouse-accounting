import type { SummaryStats } from "../model/use-fuel-movements-data";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { BarChart3, Database, Fuel, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Props {
  stats: SummaryStats;
  uniqueTanksCount: number;
  nozzleCount: number;
  lastRefreshTime: Date | null;
  formatCurrency: (amount: number | null) => string;
}

export function FuelMovementsSummaryCards({
  stats,
  uniqueTanksCount,
  nozzleCount,
  lastRefreshTime,
  formatCurrency,
}: Props) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
      label: t("fuel_movements.shift_total_amount"),
      value: formatCurrency(stats.totalShiftAmount),
      sub: t("currency.sum"),
      border: "border-blue-700",
      bg: "bg-blue-50/30 dark:bg-blue-900/20 dark:border-blue-700",
      text: "text-blue-700 dark:text-blue-300",
      valueText: "text-blue-900 dark:text-blue-100",
      subText: "text-blue-300",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-300" />,
      label: t("fuel_movements.total_amount"),
      value: formatCurrency(stats.totalRealTimeAmount),
      sub: t("currency.sum"),
      border: "border-green-700",
      bg: "bg-green-50/30 dark:bg-green-900/20 dark:border-green-700",
      text: "text-green-700 dark:text-green-300",
      valueText: "text-green-900 dark:text-green-100",
      subText: "text-green-300",
    },
    {
      icon: <Fuel className="h-5 w-5 text-purple-600 dark:text-purple-300" />,
      label: t("fuel_movements.calc_total_amount"),
      value: formatCurrency(stats.totalDbAmount),
      sub: t("currency.sum"),
      border: "border-purple-700",
      bg: "bg-purple-50/30 dark:bg-purple-900/20 dark:border-purple-700",
      text: "text-purple-700 dark:text-purple-300",
      valueText: "text-purple-900 dark:text-purple-100",
      subText: "text-purple-300",
    },
    {
      icon: <Database className="h-5 w-5 text-orange-600 dark:text-orange-300" />,
      label: t("fuel_movements.fuel_types"),
      value: String(uniqueTanksCount),
      sub: `${stats.activeNozzles} / ${nozzleCount} ${t("fuel_movements.nozzles_active")}`,
      border: "border-orange-700",
      bg: "bg-orange-50/30 dark:bg-orange-900/20 dark:border-orange-700",
      text: "text-orange-700 dark:text-orange-300",
      valueText: "text-orange-900 dark:text-orange-100",
      subText: "text-orange-300",
      extra: lastRefreshTime ? (
        <div className="text-xs text-orange-500 mt-1">{format(lastRefreshTime, "HH:mm:ss")}</div>
      ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className={`${c.border} ${c.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {c.icon}
              <div className="flex-1">
                <p className={`text-sm font-medium ${c.text}`}>{c.label}</p>
                <div className={`text-2xl font-bold ${c.valueText}`}>{c.value}</div>
                <div className={`text-xs ${c.subText}`}>{c.sub}</div>
                {c.extra}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
