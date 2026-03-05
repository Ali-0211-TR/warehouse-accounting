import type { TankGroupData } from "../model/use-fuel-movements-data";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { Database } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Props {
  data: TankGroupData[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  formatVolume: (v: number | null) => string;
  formatDecimal: (v: number) => string;
  formatCurrency: (v: number | null) => string;
}

export function FuelMovementsTankSummary({
  data,
  isLoading,
  hasActiveFilters,
  formatVolume,
  formatDecimal,
  formatCurrency,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card className="bg-white/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-400" />
          {t("fuel_movements.tank_summary", "Tank Summary")}
        </CardTitle>
        <CardDescription>
          {t("fuel_movements.tank_grouped_description", "Fuel data grouped by tank/fuel type")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-4 w-16 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : data.length === 0 ? (
            <div className="col-span-full text-center p-8 text-slate-400">
              {hasActiveFilters
                ? t("fuel_movements.no_tanks_found_with_filter", "No tanks found with current filter")
                : t("fuel_movements.no_tanks_available", "No tank data available")}
            </div>
          ) : (
            data.map((tank) => (
              <Card
                key={tank.tankName}
                className="border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold truncate">
                      <span className="text-slate-900 dark:text-slate-100">{tank.tankName}</span>
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {t("fuel_movements.nozzles_count", "nozzles", { count: tank.nozzleCount })}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Shift Totals */}
                    <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                        {t("fuel_movements.shift_totals")}
                      </p>
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        {formatVolume(tank.shiftVolume)} {t("fuel_movements.unit.liter", "L")}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        {formatCurrency(tank.shiftAmount)} {t("fuel_movements.unit.sum", "сум")}
                      </div>
                    </div>

                    {/* Real-time Totals */}
                    <div className="bg-green-50/60 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                        {t("fuel_movements.total")}
                      </p>
                      <div className="text-sm font-bold text-green-900 dark:text-green-100">
                        {formatVolume(tank.totalVolume)} {t("fuel_movements.unit.liter", "L")}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {formatCurrency(tank.totalAmount)} {t("fuel_movements.unit.sum", "сум")}
                      </div>
                    </div>

                    {/* Database Totals */}
                    <div className="bg-purple-50/60 dark:bg-purple-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                        {t("fuel_movements.calc_total")}
                      </p>
                      <div className="text-sm font-bold text-purple-900 dark:text-purple-100">
                        {formatDecimal(tank.dbVolume)} {t("fuel_movements.unit.liter", "L")}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        {formatCurrency(tank.dbAmount)} {t("fuel_movements.unit.sum", "сум")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t("fuel_movements.last_update")}: {format(new Date(tank.lastUpdated), "HH:mm")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
