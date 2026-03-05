import { orderApi } from "@/entities/order/api/order-api";
import { initOrderFilter } from "@/entities/order/model/schemas";
import type { OrderMovementSummaryMeta } from "@/shared/bindings/dtos/OrderMovementSummaryMeta";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import useToast from "@/shared/hooks/use-toast";

export interface ComparisonPeriod {
  label: string;
  dateRange: [string, string];
}

export interface ComparisonData {
  period1: OrderMovementSummaryMeta & { orderCount: number };
  period2: OrderMovementSummaryMeta & { orderCount: number };
}

export interface ComparisonRow {
  label: string;
  period1Value: number;
  period2Value: number;
  diff: number;
  diffPercent: number | null;
}

export function useComparisonData() {
  const { t } = useTranslation();
  const { showErrorToast } = useToast();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [period1, setPeriod1] = useState<ComparisonPeriod | null>(null);
  const [period2, setPeriod2] = useState<ComparisonPeriod | null>(null);

  const loadComparison = useCallback(
    async (p1: ComparisonPeriod, p2: ComparisonPeriod) => {
      setIsLoading(true);
      setPeriod1(p1);
      setPeriod2(p2);

      try {
        const baseFilter = {
          first: 0,
          rows: 1,
          page: 1,
          sort_field: "DCreated" as const,
          sort_order: "Desc" as const,
        };

        const [result1, result2] = await Promise.all([
          orderApi.getMovementReport({
            ...baseFilter,
            filters: { ...initOrderFilter, d_move: p1.dateRange },
          }),
          orderApi.getMovementReport({
            ...baseFilter,
            filters: { ...initOrderFilter, d_move: p2.dateRange },
          }),
        ]);

        setData({
          period1: { ...result1.meta, orderCount: result1.count },
          period2: { ...result2.meta, orderCount: result2.count },
        });
      } catch (error: any) {
        console.error("Failed to load comparison:", error);
        showErrorToast(error.message || t("comparison.error", "Ошибка загрузки"));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [showErrorToast, t],
  );

  const buildRows = useCallback((): ComparisonRow[] => {
    if (!data) return [];

    const calcDiff = (v1: number, v2: number): { diff: number; diffPercent: number | null } => {
      const diff = v2 - v1;
      const diffPercent = v1 !== 0 ? (diff / Math.abs(v1)) * 100 : v2 !== 0 ? 100 : null;
      return { diff, diffPercent };
    };

    const makeRow = (label: string, v1: number, v2: number): ComparisonRow => ({
      label,
      period1Value: v1,
      period2Value: v2,
      ...calcDiff(v1, v2),
    });

    const p1 = data.period1;
    const p2 = data.period2;

    return [
      makeRow(t("comparison.order_count", "Количество ордеров"), p1.orderCount, p2.orderCount),
      makeRow(t("report.total_incoming", "Общий доход"), p1.totalIncoming, p2.totalIncoming),
      makeRow(t("report.total_outgoing", "Общий расход"), p1.totalOutgoing, p2.totalOutgoing),
      makeRow(t("report.net_flow", "Чистый результат"), p1.totalSum, p2.totalSum),
      makeRow(t("order.type.income", "Приход"), p1.totalsByType.incomeSum, p2.totalsByType.incomeSum),
      makeRow(t("order.type.sale", "Продажа"), p1.totalsByType.saleSum, p2.totalsByType.saleSum),
      makeRow(t("order.type.outcome", "Расход"), p1.totalsByType.outcomeSum, p2.totalsByType.outcomeSum),
      makeRow(t("order.type.returns", "Возвраты"), p1.totalsByType.returnsSum, p2.totalsByType.returnsSum),
      makeRow(t("order.tax", "Налог"), p1.totalTax, p2.totalTax),
      makeRow(t("order.discount", "Скидки"), p1.totalDiscount, p2.totalDiscount),
    ];
  }, [data, t]);

  return {
    data,
    isLoading,
    period1,
    period2,
    loadComparison,
    buildRows,
  };
}
