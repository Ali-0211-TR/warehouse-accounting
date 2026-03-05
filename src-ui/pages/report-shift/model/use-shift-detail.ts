import { orderApi } from "@/entities/order/api/order-api";
import { initOrderFilter } from "@/entities/order/model/schemas";
import type { OrderEntity } from "@/entities/order";
import type { ShiftEntity } from "@/entities/shift/model/types";
import type { OrderMovementSummaryMeta } from "@/shared/bindings/dtos/OrderMovementSummaryMeta";
import type { MetaPaginatorDTO } from "@/shared/bindings/dtos/MetaPaginatorDTO";
import { useCallback, useState } from "react";

export interface ShiftDetailData {
  shift: ShiftEntity;
  orders: MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>;
  loading: boolean;
}

export function useShiftDetail() {
  const [detailData, setDetailData] = useState<ShiftDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadShiftDetail = useCallback(async (shift: ShiftEntity) => {
    setLoading(true);
    try {
      const dOpen = shift.d_open;
      const dClose = shift.d_close || new Date().toISOString();

      const result = await orderApi.getMovementReport({
        first: 0,
        rows: 1000,
        page: 1,
        sort_field: "DCreated",
        sort_order: "Desc",
        filters: {
          ...initOrderFilter,
          d_move: [dOpen, dClose],
        },
      });

      setDetailData({
        shift,
        orders: result,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load shift detail:", error);
      setDetailData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDetail = useCallback(() => {
    setDetailData(null);
  }, []);

  return {
    detailData,
    loading,
    loadShiftDetail,
    clearDetail,
  };
}
