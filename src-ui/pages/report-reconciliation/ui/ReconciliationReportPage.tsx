import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/shadcn/card";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Scale,
  XCircle,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useTranslation } from "react-i18next";

import { useReconciliationData } from "../model/use-reconciliation-data";

export function ReconciliationReportPage() {
  const { t } = useTranslation();
  const {
    items,
    summary,
    isLoading,
    isInitialLoading,
    lastRefreshTime,
    selectedShift,
    handleShiftSelect,
    refreshData,
  } = useReconciliationData();

  const formatVolume = (v: number | null): string => {
    if (v === null) return "N/A";
    return (v / 100).toFixed(2);
  };

  const formatAmount = (v: number | null): string => {
    if (v === null) return "N/A";
    return Number(v).toLocaleString("ru-RU", { minimumFractionDigits: 2 });
  };

  const formatDiff = (v: number | null): string => {
    if (v === null) return "N/A";
    const sign = v >= 0 ? "+" : "";
    return `${sign}${v.toFixed(2)}`;
  };

  const statusConfig = {
    match: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      label: t("reconciliation.match", "Совпадает"),
      color: "text-green-600 bg-green-50 border-green-200",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      label: t("reconciliation.warning", "Расхождение"),
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    },
    critical: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      label: t("reconciliation.critical", "Критическое"),
      color: "text-red-600 bg-red-50 border-red-200",
    },
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-lg">{t("control.loading")}</span>
      </div>
    );
  }

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={refreshData}
      disabled={isLoading}
    >
      <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
      {t("control.refresh")}
    </Button>
  );

  return (
    <ReportLayout
      title="menu.report.reconciliation"
      icon={<Scale className="h-6 w-6 text-blue-300" />}
      showShiftSelector
      selectedShift={selectedShift}
      onShiftSelect={handleShiftSelect}
      headerActions={headerActions}
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <div className="text-3xl font-bold">{summary.totalItems}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("reconciliation.total_nozzles", "Всего пистолетов")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <div className="text-3xl font-bold text-green-600">{summary.matchCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("reconciliation.matches", "Совпадений")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{summary.warningCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("reconciliation.warnings", "Предупреждений")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <div className="text-3xl font-bold text-red-600">{summary.criticalCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("reconciliation.critical_count", "Критических")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last refresh */}
      {lastRefreshTime && (
        <div className="text-xs text-muted-foreground text-right">
          {t("reconciliation.last_update", "Обновлено")}: {lastRefreshTime.toLocaleTimeString()}
        </div>
      )}

      {/* Reconciliation table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-500" />
            {t("reconciliation.comparison_table", "Таблица сверки ТРК vs БД")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-3">{t("reconciliation.dispenser", "ТРК")}</th>
                  <th className="text-center py-2 pr-3">{t("reconciliation.nozzle", "Пистолет")}</th>
                  <th className="text-left py-2 pr-3">{t("reconciliation.tank", "Ёмкость")}</th>
                  <th className="text-right py-2 pr-3">{t("reconciliation.trk_volume", "ТРК объём (L)")}</th>
                  <th className="text-right py-2 pr-3">{t("reconciliation.db_volume", "БД объём (L)")}</th>
                  <th className="text-right py-2 pr-3">{t("reconciliation.diff_volume", "Разница (L)")}</th>
                  <th className="text-right py-2 pr-3">{t("reconciliation.trk_amount", "ТРК сумма")}</th>
                  <th className="text-right py-2 pr-3">{t("reconciliation.db_amount", "БД сумма")}</th>
                  <th className="text-center py-2">{t("reconciliation.status", "Статус")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-3">{item.dispenserName}</td>
                      <td className="py-2 pr-3 text-center font-mono">{item.nozzleAddress}</td>
                      <td className="py-2 pr-3">{item.tank}</td>
                      <td className="py-2 pr-3 text-right font-mono">{formatVolume(item.trkVolume)}</td>
                      <td className="py-2 pr-3 text-right font-mono">{item.dbVolume.toFixed(2)}</td>
                      <td className={cn(
                        "py-2 pr-3 text-right font-mono font-semibold",
                        item.status === "match" && "text-green-600",
                        item.status === "warning" && "text-yellow-600",
                        item.status === "critical" && "text-red-600",
                      )}>
                        {formatDiff(item.volumeDiff)}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{formatAmount(item.trkAmount)}</td>
                      <td className="py-2 pr-3 text-right font-mono">{formatAmount(item.dbAmount)}</td>
                      <td className="py-2 text-center">
                        <Badge variant="outline" className={cn("text-xs", cfg.color)}>
                          <span className="flex items-center gap-1">
                            {cfg.icon}
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </span>
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="py-2 pr-3" colSpan={3}>{t("reconciliation.total", "Итого")}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatVolume(summary.totalTrkVolume)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{summary.totalDbVolume.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right font-mono">
                      {summary.totalTrkVolume !== null
                        ? formatDiff((summary.totalTrkVolume / 100) - summary.totalDbVolume)
                        : "N/A"}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{formatAmount(summary.totalTrkAmount)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatAmount(summary.totalDbAmount)}</td>
                    <td className="py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t("reconciliation.no_data", "Нет данных для сверки")}
            </div>
          )}
        </CardContent>
      </Card>
    </ReportLayout>
  );
}
