import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/shadcn/card";
import { Button } from "@/shared/ui/shadcn/button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Equal,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";

import { useComparisonData, type ComparisonPeriod } from "../model/use-comparison-data";

type PresetKey = "today_yesterday" | "this_week_last_week" | "custom";

export function ComparisonReportPage() {
  const { t } = useTranslation();
  const { data, isLoading, period1, period2, loadComparison, buildRows } = useComparisonData();

  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [customFrom1, setCustomFrom1] = useState("");
  const [customTo1, setCustomTo1] = useState("");
  const [customFrom2, setCustomFrom2] = useState("");
  const [customTo2, setCustomTo2] = useState("");

  const fmtAmount = (v: number) =>
    Number(v).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePreset = useCallback(
    (preset: PresetKey) => {
      setActivePreset(preset);
      const now = new Date();

      let p1: ComparisonPeriod;
      let p2: ComparisonPeriod;

      switch (preset) {
        case "today_yesterday": {
          const todayStart = startOfDay(now);
          const todayEnd = endOfDay(now);
          const yesterday = subDays(now, 1);
          const yesterdayStart = startOfDay(yesterday);
          const yesterdayEnd = endOfDay(yesterday);

          p1 = {
            label: t("comparison.yesterday", "Вчера"),
            dateRange: [yesterdayStart.toISOString(), yesterdayEnd.toISOString()],
          };
          p2 = {
            label: t("comparison.today", "Сегодня"),
            dateRange: [todayStart.toISOString(), todayEnd.toISOString()],
          };
          break;
        }
        case "this_week_last_week": {
          const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
          const thisWeekEnd = endOfDay(now);
          const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
          const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

          p1 = {
            label: t("comparison.last_week", "Прошлая неделя"),
            dateRange: [lastWeekStart.toISOString(), lastWeekEnd.toISOString()],
          };
          p2 = {
            label: t("comparison.this_week", "Эта неделя"),
            dateRange: [thisWeekStart.toISOString(), thisWeekEnd.toISOString()],
          };
          break;
        }
        default:
          return;
      }

      loadComparison(p1, p2);
    },
    [loadComparison, t],
  );

  const handleCustomCompare = useCallback(() => {
    if (!customFrom1 || !customTo1 || !customFrom2 || !customTo2) return;
    setActivePreset("custom");
    loadComparison(
      {
        label: `${format(new Date(customFrom1), "dd.MM.yy")} — ${format(new Date(customTo1), "dd.MM.yy")}`,
        dateRange: [new Date(customFrom1).toISOString(), endOfDay(new Date(customTo1)).toISOString()],
      },
      {
        label: `${format(new Date(customFrom2), "dd.MM.yy")} — ${format(new Date(customTo2), "dd.MM.yy")}`,
        dateRange: [new Date(customFrom2).toISOString(), endOfDay(new Date(customTo2)).toISOString()],
      },
    );
  }, [customFrom1, customTo1, customFrom2, customTo2, loadComparison]);

  const rows = buildRows();

  return (
    <ReportLayout
      title="menu.report.comparison"
      icon={<BarChart3 className="h-6 w-6 text-blue-300" />}
    >
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activePreset === "today_yesterday" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("today_yesterday")}
          disabled={isLoading}
        >
          {t("comparison.today_vs_yesterday", "Сегодня vs Вчера")}
        </Button>
        <Button
          variant={activePreset === "this_week_last_week" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("this_week_last_week")}
          disabled={isLoading}
        >
          {t("comparison.this_week_vs_last", "Эта неделя vs Прошлая")}
        </Button>
      </div>

      {/* Custom date ranges */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">{t("comparison.custom_range", "Свой период")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("comparison.period_1", "Период 1")}</Label>
              <div className="flex gap-2">
                <Input type="date" value={customFrom1} onChange={(e) => setCustomFrom1(e.target.value)} className="text-xs" />
                <Input type="date" value={customTo1} onChange={(e) => setCustomTo1(e.target.value)} className="text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("comparison.period_2", "Период 2")}</Label>
              <div className="flex gap-2">
                <Input type="date" value={customFrom2} onChange={(e) => setCustomFrom2(e.target.value)} className="text-xs" />
                <Input type="date" value={customTo2} onChange={(e) => setCustomTo2(e.target.value)} className="text-xs" />
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={handleCustomCompare}
            disabled={isLoading || !customFrom1 || !customTo1 || !customFrom2 || !customTo2}
          >
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            {t("comparison.compare", "Сравнить")}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
          <span className="ml-2">{t("control.loading")}</span>
        </div>
      )}

      {data && !isLoading && period1 && period2 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              {t("comparison.results", "Результаты сравнения")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3">{t("comparison.metric", "Показатель")}</th>
                    <th className="text-right py-2 pr-3">{period1.label}</th>
                    <th className="text-right py-2 pr-3">{period2.label}</th>
                    <th className="text-right py-2 pr-3">{t("comparison.difference", "Разница")}</th>
                    <th className="text-center py-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-3 font-medium">{row.label}</td>
                      <td className="py-2 pr-3 text-right font-mono">{fmtAmount(row.period1Value)}</td>
                      <td className="py-2 pr-3 text-right font-mono">{fmtAmount(row.period2Value)}</td>
                      <td className={cn(
                        "py-2 pr-3 text-right font-mono font-semibold",
                        row.diff > 0 && "text-green-600",
                        row.diff < 0 && "text-red-600",
                        row.diff === 0 && "text-muted-foreground",
                      )}>
                        <span className="flex items-center justify-end gap-1">
                          {row.diff > 0 && <ArrowUp className="h-3 w-3" />}
                          {row.diff < 0 && <ArrowDown className="h-3 w-3" />}
                          {row.diff === 0 && <Equal className="h-3 w-3" />}
                          {row.diff >= 0 ? "+" : ""}{fmtAmount(row.diff)}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {row.diffPercent !== null ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-mono",
                              row.diffPercent > 0 && "text-green-600 border-green-200",
                              row.diffPercent < 0 && "text-red-600 border-red-200",
                              row.diffPercent === 0 && "text-muted-foreground",
                            )}
                          >
                            {row.diffPercent >= 0 ? "+" : ""}{row.diffPercent.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!data && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("comparison.select_periods", "Выберите периоды для сравнения")}</p>
        </div>
      )}
    </ReportLayout>
  );
}
