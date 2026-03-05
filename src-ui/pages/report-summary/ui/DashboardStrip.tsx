import { useShiftStore } from "@/entities/shift/model/store";
import { useDispenserStore } from "@/entities/dispenser";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Clock, Fuel, Monitor, User } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Real-time dashboard strip showing current shift + dispenser status.
 * Shown at the top of SummaryReportPage overview tab.
 */
export function DashboardStrip() {
  const { t } = useTranslation();
  const { currentShift, getCurrentShift } = useShiftStore();
  const { dispensers } = useDispenserStore();

  useEffect(() => {
    getCurrentShift().catch(() => {});
  }, [getCurrentShift]);

  const dispenserStats = useMemo(() => {
    let online = 0;
    let total = 0;
    let totalNozzles = 0;
    dispensers.forEach((d) => {
      total++;
      if (d.state === "Active") online++;
      totalNozzles += d.nozzles?.length || 0;
    });
    return { online, total, totalNozzles };
  }, [dispensers]);

  const shiftDuration = useMemo(() => {
    if (!currentShift) return null;
    const dOpen = new Date(currentShift.d_open);
    const now = new Date();
    const mins = differenceInMinutes(now, dOpen);
    return `${Math.floor(mins / 60)}ч ${mins % 60}мин`;
  }, [currentShift]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {/* Current shift */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t("dashboard.current_shift", "Текущая смена")}
              </div>
              {currentShift ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="default" className="text-[10px] bg-green-500 px-1 py-0">
                    {t("shift.status_open", "Открыта")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{shiftDuration}</span>
                </div>
              ) : (
                <Badge variant="secondary" className="text-[10px] mt-0.5">
                  {t("dashboard.no_shift", "Нет")}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operator */}
      <Card>
        <CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t("dashboard.operator", "Оператор")}
              </div>
              <div className="text-xs font-medium truncate mt-0.5">
                {currentShift?.user_open?.full_name || currentShift?.user_open?.username || "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispensers status */}
      <Card>
        <CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t("dashboard.dispensers", "ТРК")}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-medium">
                  {dispenserStats.online}/{dispenserStats.total}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 ${
                    dispenserStats.online === dispenserStats.total
                      ? "text-green-600 border-green-200"
                      : "text-yellow-600 border-yellow-200"
                  }`}
                >
                  {dispenserStats.online === dispenserStats.total ? "OK" : "!"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nozzles */}
      <Card>
        <CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-cyan-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t("dashboard.nozzles", "Пистолеты")}
              </div>
              <div className="text-xs font-medium mt-0.5">
                {dispenserStats.totalNozzles}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
