import type { FuelMovement } from "../model/use-fuel-movements-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Props {
  data: FuelMovement[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  formatVolume: (v: number | null) => string;
  formatDecimal: (v: number) => string;
  formatCurrency: (v: number | null) => string;
}

export function FuelMovementsNozzleTable({
  data,
  isLoading,
  hasActiveFilters,
  formatVolume,
  formatDecimal,
  formatCurrency,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("fuel_movements.dispensers_totals")}</CardTitle>
        <CardDescription>
          {t("fuel_movements.real_time_data_from_n_nozzles", { length: data.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop / tablet table */}
        <div className="hidden sm:block w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-3 font-semibold">{t("dispenser.dispenser", "Dispenser")}</th>
                <th className="text-center p-3 font-semibold">{t("fuel_movements.nozzle")}</th>
                <th className="text-left p-3 font-semibold">{t("fuel_movements.tank")}</th>
                <th className="text-right p-3 font-semibold">{t("fuel_movements.shift_totals")}</th>
                <th className="text-right p-3 font-semibold">{t("fuel_movements.total")}</th>
                <th className="text-right p-3 font-semibold">{t("fuel_movements.calc_total")}</th>
                <th className="text-center p-3 font-semibold">{t("fuel_movements.last_update")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    {hasActiveFilters
                      ? t("fuel_movements.no_data_found_with_current_filter")
                      : t("fuel_movements.no_data", "No data available")}
                  </td>
                </tr>
              ) : (
                data.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100 break-words max-w-[150px]">
                      {m.dispenserName}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        @:{m.nozzleAddress}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100 break-words max-w-[120px]">
                      {m.tank}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-slate-100">
                      {formatVolume(m.shiftVolume)} / {formatCurrency(m.shiftAmount)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-slate-100">
                      {formatVolume(m.totalVolume)} / {formatCurrency(m.totalAmount)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 dark:text-slate-100">
                      {formatDecimal(m.foVolume)} / {formatCurrency(m.foAmount)}
                    </td>
                    <td className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(m.lastUpdated), "HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="block sm:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="mt-2 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : data.length === 0 ? (
            <div className="text-center p-6 text-slate-400">
              {hasActiveFilters
                ? t("fuel_movements.no_data_found_with_current_filter")
                : t("fuel_movements.no_data", "No data available")}
            </div>
          ) : (
            data.map((m) => (
              <Card key={m.id} className="bg-white dark:bg-slate-800">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {m.dispenserName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{m.tank}</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      @:{m.nozzleAddress}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("fuel_movements.shift_totals")}
                      </div>
                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {formatVolume(m.shiftVolume)}
                      </div>
                      <div className="text-[10px] text-blue-700 dark:text-blue-300">
                        {formatCurrency(m.shiftAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("fuel_movements.total")}
                      </div>
                      <div className="text-sm font-semibold text-green-900 dark:text-green-100">
                        {formatVolume(m.totalVolume)}
                      </div>
                      <div className="text-[10px] text-green-700 dark:text-green-300">
                        {formatCurrency(m.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("fuel_movements.calc_total")}
                      </div>
                      <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {formatDecimal(m.foVolume)}
                      </div>
                      <div className="text-[10px] text-purple-700 dark:text-purple-300">
                        {formatCurrency(m.foAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 text-xs text-slate-400">
                    {t("fuel_movements.last_update")}: {format(new Date(m.lastUpdated), "HH:mm")}
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
