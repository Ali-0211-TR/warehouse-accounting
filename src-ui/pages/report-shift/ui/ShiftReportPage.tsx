import { ShiftList, useShift } from "@/features/shift";
import { CloseShiftForm } from "@/features/shift/ui/close-shift-form";
import { OpenShiftForm } from "@/features/shift/ui/open-shift-form";
import { ShiftFilters } from "@/features/shift/ui/shift-filters";
import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { Button } from "@/shared/ui/shadcn/button";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Filter } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ShiftEntity } from "@/entities/shift/model/types";

import { useShiftDetail } from "../model/use-shift-detail";
import { ShiftDetailView } from "./ShiftDetailView";

export function ShiftReportPage() {
  const { t } = useTranslation();

  const {
    shifts,
    currentShift,
    loading,
    filtersVisible,
    openShiftVisible,
    closeShiftVisible,
    hasActiveFilters,
    pagination,

    onCancel,
    onOpenShiftSubmit,
    onCloseShiftSubmit,
    onShowFilters,
    onHideFilters,
    filters,
    setFilters,
    pageChange,
    onSort,
  } = useShift();

  const { detailData, loading: detailLoading, loadShiftDetail, clearDetail } = useShiftDetail();

  const handleShiftClick = useCallback(
    async (shift: ShiftEntity) => {
      await loadShiftDetail(shift);
    },
    [loadShiftDetail],
  );

  // If viewing shift detail, show the detail view
  if (detailData) {
    return (
      <ReportLayout title="menu.report.shift_report">
        <ShiftDetailView data={detailData} onBack={clearDetail} />
      </ReportLayout>
    );
  }

  const headerActions = (
    <Button
      variant={hasActiveFilters ? "default" : "outline"}
      size="sm"
      onClick={onShowFilters}
    >
      <Filter className="h-4 w-4 mr-2" />
      {t("control.filters")}
      {hasActiveFilters && (
        <Badge variant="secondary" className="ml-2">!</Badge>
      )}
    </Button>
  );

  return (
    <ReportLayout
      title="menu.report.shift_report"
      headerActions={headerActions}
    >
      {/* Shift list */}
      <div className="overflow-x-auto">
        <ShiftList
          shifts={shifts}
          loading={loading || detailLoading}
          pagination={pagination}
          onPageChange={pageChange}
          onSort={onSort}
          selectable={true}
          onRowClick={handleShiftClick}
        />
      </div>

      {/* Filters Dialog */}
      <ShiftFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Open Shift Form */}
      <OpenShiftForm
        open={openShiftVisible}
        onClose={onCancel}
        onSubmit={onOpenShiftSubmit}
      />

      {/* Close Shift Form */}
      <CloseShiftForm
        open={closeShiftVisible}
        onClose={onCancel}
        shift={currentShift}
        onSubmit={onCloseShiftSubmit}
      />
    </ReportLayout>
  );
}
